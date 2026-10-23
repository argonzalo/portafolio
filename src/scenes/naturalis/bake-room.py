"""Blender background: original Naturalis room + existing own camilla.

Run from the repository root with Blender --background --python this-file.
Sources stay in assets-src; only optimized outputs go to public.
"""
import bpy, math, random, json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / 'assets-src/naturalis'
random.seed(24)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 128
scene.cycles.use_denoising = True
scene.render.bake.margin = 8
scene.world = bpy.data.worlds.new('Fill cielo')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.73,.85,.82,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .35
scene.view_settings.view_transform = 'Standard'

def mat(name, color, rough=.7, grain=0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color,1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = 0
    if grain:
        n=m.node_tree.nodes.new('ShaderNodeTexNoise');n.inputs['Scale'].default_value=grain
        b=m.node_tree.nodes.new('ShaderNodeBump');b.inputs['Strength'].default_value=.16;b.inputs['Distance'].default_value=.018
        m.node_tree.links.new(n.outputs['Fac'],b.inputs['Height']);m.node_tree.links.new(b.outputs['Normal'],p.inputs['Normal'])
    return m

plaster=mat('Cal mineral',(.82,.80,.74),.92,90)
floor=mat('Piedra caliza',(.65,.63,.57),.88,65)
wood=mat('Roble claro',(.48,.32,.17),.65,125)
linen=mat('Lino crudo',(.82,.79,.66),.94,180)
ceramic=mat('Ceramica mate',(.56,.59,.50),.65,100)
green=mat('Ficus salvia',(.12,.27,.16),.58,65)
soil=mat('Tierra',(.055,.04,.025),1,100)
objects=[]

def box(name, loc, dims, material, bevel=.02):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name
    o.dimensions=dims;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    b=o.modifiers.new('Cantos suaves','BEVEL');b.width=bevel;b.segments=2
    bpy.ops.object.modifier_apply(modifier=b.name)
    o.data.materials.append(material);objects.append(o);return o

def lathe(name, x,y, profile,material):
    n=32;v=[];faces=[]
    for z,r in profile:
        v.extend([(x+r*math.cos(j*2*math.pi/n),y+r*math.sin(j*2*math.pi/n),z) for j in range(n)])
    for k in range(len(profile)-1):
        for j in range(n):a=k*n+j;b=k*n+(j+1)%n;faces.append((a,b,b+n,a+n))
    me=bpy.data.meshes.new(name);me.from_pydata(v,[],faces);me.update()
    o=bpy.data.objects.new(name,me);scene.collection.objects.link(o);me.materials.append(material)
    for p in me.polygons:p.use_smooth=True
    objects.append(o);return o

box('Suelo biselado',(0,0,-.09),(4.8,3.6,.18),floor)
# Open corner with a real opening for the window.
box('Pared fondo',(0,1.82,1.4),(4.8,.14,2.8),plaster)
box('Jamba izquierda',(-2.4,-1.50,1.4),(.14,.6,2.8),plaster)
box('Jamba derecha',(-2.4,1.44,1.4),(.14,.76,2.8),plaster)
box('Dintel',(-2.4,-.2,2.68),(.14,2.5,.24),plaster)
box('Antepecho',(-2.4,-.2,.24),(.14,2.5,.48),plaster)
box('Marco ventana',(-2.37,-.2,.5),(.20,2.5,.06),wood)
box('Zocalo',(0,1.72,.065),(4.72,.04,.13),wood,.008)
box('Mesa de trabajo',(1.25,.63,.80),(1.42,.73,.07),wood)
for x in [.65,1.85]:
    for y in [.37,.89]:box('Pata mesa',(x,y,.39),(.045,.045,.78),wood,.007)
box('Estante pared',(.6,1.63,1.63),(2.65,.28,.055),wood,.012)

# Own camilla from the existing .blend, without modifying its source.
with bpy.data.libraries.load(str(SRC/'camilla.blend'), link=False) as (a,b):
    b.objects=[n for n in a.objects if n in ['camilla_base','camilla_tapizado','camilla_toalla']]
for o in b.objects:
    scene.collection.objects.link(o);o.location=(-.55,-.18,0);objects.append(o)
    for m in o.data.materials:
        uv=m.node_tree.nodes.new('ShaderNodeUVMap');uv.uv_map='UV0'
        for node in m.node_tree.nodes:
            if node.type=='TEX_IMAGE':m.node_tree.links.new(uv.outputs['UV'],node.inputs['Vector'])

# Tailored pleated linen. The curtain remains a separate mesh for vertex wind.
v=[];f=[];cols=72;rows=10
for k in range(rows+1):
    t=k/rows
    for j in range(cols+1):
        u=j/cols; y=-1.31+u*.95
        x=-2.22+.065*math.cos(u*math.pi*18)+.025*math.sin(t*5+u*8)
        z=.17+t*2.35+.012*math.cos(u*math.pi*18)
        v.append((x,y,z))
for k in range(rows):
    for j in range(cols):a=k*(cols+1)+j;f.append((a,a+1,a+cols+2,a+cols+1))
me=bpy.data.meshes.new('Lino pliegues');me.from_pydata(v,[],f);me.materials.append(linen)
curtain=bpy.data.objects.new('Cortina_lino',me);scene.collection.objects.link(curtain);objects.append(curtain)
for p in me.polygons:p.use_smooth=True
box('Riel cortina',(-2.16,-.84,2.56),(.045,1.12,.035),wood,.008)

# Sculpted pot and leaf surfaces with a central vein and curling silhouette.
lathe('Maceta',-1.67,-1.05,[(0,.20),(.02,.23),(.42,.29),(.46,.28),(.46,.25),(.41,.25)],ceramic)
lathe('Tierra',-1.67,-1.05,[(.41,0),(.41,.25)],soil)
lathe('Tallo',-1.67,-1.05,[(.41,.018),(1.65,.01),(1.84,.002)],wood)
for i in range(18):
    angle=i*2.40;z=.62+(i%9)*.123;length=.34+(i%3)*.055
    direction=Vector((math.cos(angle),math.sin(angle),.5)).normalized()
    side=Vector((-math.sin(angle),math.cos(angle),0))
    origin=Vector((-1.67,-1.05,z));verts=[];faces=[]
    for k in range(9):
        t=k/8;center=origin+direction*(t*length)
        center.z+=.07*math.sin(t*math.pi)-.06*t*t
        width=math.sin(t*math.pi)**.8*length*.25
        for j in [-1,0,1]:
            q=center+side*(width*j);q.z+=.018*(1-abs(j))*math.sin(t*math.pi);verts.append(q)
    for k in range(8):
        for j in range(2):a=k*3+j;faces.append((a,a+1,a+4,a+3))
    me=bpy.data.meshes.new('Hoja');me.from_pydata(verts,[],faces);me.materials.append(green)
    o=bpy.data.objects.new('Ficus_hoja',me);scene.collection.objects.link(o);objects.append(o)
    for p in me.polygons:p.use_smooth=True
lathe('Florero',1.18,1.60,[(1.66,.06),(1.68,.09),(1.84,.08),(1.94,.035),(1.96,.04)],ceramic)
box('Toallas dobladas',(.2,1.57,1.72),(.55,.24,.13),linen,.045)

def light(name,loc,power,color,size,target):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=color;d.shape='DISK';d.size=size
    o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();return d
key=light('Key ventana',(-3.7,-.4,2.4),180,(1,.97,.92),2.0,(0,0,.4))
fill=light('Fill frontal',(1,-3,3.2),85,(.91,.96,1),3,(0,0,.7))
rim=light('Rim rebote',(1.5,1,2.6),40,(1,.96,.88),1.8,(-.6,-.2,.6))
night=light('Luz de trabajo nocturna',(1.2,.5,2.15),0,(1,.65,.30),.6,(1.2,.5,.7))

# One unwrap and one bake target guarantee a shared, non-overlapping atlas.
vg=curtain.vertex_groups.new(name='CURTAIN_vertices');vg.add(list(range(len(curtain.data.vertices))),1,'REPLACE')
bpy.ops.object.select_all(action='DESELECT')
for o in objects:
    o.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
bpy.ops.object.join();room=bpy.context.object;room.name='Sala_camilla'
for o in [room]:
    bpy.context.view_layer.objects.active=o
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True)
    for uv in o.data.uv_layers:uv.active_render=False
    uv=o.data.uv_layers.new(name='BakeUV');uv.active_render=True
    o.data.uv_layers.active=uv
room.select_set(True);bpy.context.view_layer.objects.active=room
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.012)
bpy.ops.object.mode_set(mode='OBJECT')
materials=set(m for m in room.data.materials if m)
textures=SRC/'textures';textures.mkdir(exist_ok=True)
for mode in ['day','night']:
    if mode=='night':
        key.energy=18;key.color=(.22,.43,.75);fill.energy=14;fill.color=(.23,.40,.70)
        rim.energy=12;rim.color=(.3,.5,.8);night.energy=65
        scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.07,.14,.26,1)
        scene.world.node_tree.nodes['Background'].inputs[1].default_value=.18
    image=bpy.data.images.new('Naturalis_'+mode,width=1024,height=1024,alpha=False)
    for m in materials:
        node=m.node_tree.nodes.new('ShaderNodeTexImage');node.image=image;m.node_tree.nodes.active=node
    bpy.ops.object.bake(type='COMBINED',pass_filter={'DIRECT','INDIRECT','COLOR','DIFFUSE','GLOSSY','EMIT'},use_clear=True,margin=8)
    image.filepath_raw=str(textures/('room-'+mode+'.png'));image.file_format='PNG';image.save()

# Export one inexpensive baked shader per mesh; runtime blends the two atlases.
for o in [room]:
    bake=o.data.uv_layers['BakeUV']
    coords=[tuple(x.uv) for x in bake.data]
    while len(o.data.uv_layers):o.data.uv_layers.remove(o.data.uv_layers[0])
    uv=o.data.uv_layers.new(name='UVMap')
    for d,c in zip(uv.data,coords):d.uv=c
    m=bpy.data.materials.new(o.name+'_baked');m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Roughness'].default_value=.85;p.inputs['Metallic'].default_value=0
    tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images['Naturalis_day']
    m.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color'])
    o.data.materials.clear();o.data.materials.append(m)
    for poly in o.data.polygons:poly.material_index=0
    tri=o.modifiers.new('Triangulate','TRIANGULATE');bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=tri.name)

# Split linen after baking so it can be hidden on mobile and moved in a shader.
bpy.context.view_layer.objects.active=room
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='DESELECT');bpy.ops.object.mode_set(mode='OBJECT')
room.vertex_groups.active_index=room.vertex_groups['CURTAIN_vertices'].index
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.object.vertex_group_select();bpy.ops.mesh.separate(type='SELECTED');bpy.ops.object.mode_set(mode='OBJECT')
curtain=next(o for o in bpy.context.selected_objects if o!=room);curtain.name='Cortina_lino'

bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'sala.blend'))
bpy.ops.object.select_all(action='DESELECT');room.select_set(True);curtain.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(SRC/'sala.glb'),export_format='GLB',use_selection=True,export_yup=True,export_animations=False,export_lights=False,export_cameras=False)
report={o.name:len(o.data.polygons) for o in [room,curtain]}
(SRC/'sala-report.json').write_text(json.dumps(report,indent=2))
print('NATURALIS_BAKE_OK',report)
