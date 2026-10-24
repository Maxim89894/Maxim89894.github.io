# blender -b -P render_turntable.py -- avatar.glb frames/
# Рендерит 120 кадров полного оборота камеры вокруг аватара (рост ~1.8 м, как у Ready Player Me).
import bpy, sys, math
src, out = sys.argv[sys.argv.index('--')+1:][:2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
sc = bpy.context.scene
sc.render.resolution_x, sc.render.resolution_y = 800, 1000
for e in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
    try: sc.render.engine = e; break
    except TypeError: pass
sc.world = bpy.data.worlds.new('w'); sc.world.use_nodes = True
sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.03, 0.03, 0.06, 1)  # фон под цвет сайта
rig = bpy.data.objects.new('rig', None); sc.collection.objects.link(rig)
tgt = bpy.data.objects.new('tgt', None); tgt.location = (0, 0, 1.0); sc.collection.objects.link(tgt)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); cam.location = (0, -3.4, 1.2); cam.parent = rig
c = cam.constraints.new('TRACK_TO'); c.target = tgt; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
sc.collection.objects.link(cam); sc.camera = cam
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 3; sun.rotation_euler = (0.9, 0, 0.6); sun.parent = rig
sc.collection.objects.link(sun)
rig.rotation_euler = (0, 0, 0); rig.keyframe_insert('rotation_euler', frame=1)
rig.rotation_euler = (0, 0, 2*math.pi); rig.keyframe_insert('rotation_euler', frame=121)
for f in rig.animation_data.action.fcurves:
    for k in f.keyframe_points: k.interpolation = 'LINEAR'
sc.frame_start, sc.frame_end = 1, 120   # кадр 121 = кадр 1, поэтому оборот замыкается без шва
sc.render.filepath = out + '/'
sc.render.image_settings.file_format = 'PNG'
bpy.ops.render.render(animation=True)
