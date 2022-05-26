import os
from typing import List, Union
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sklecvis.settings')
django.setup()
from api.models import DatasetTag

class Tag:

    def __init__(self, name, full_name, children, ) -> None:
        self.name = name
        self.full_name = full_name
        self.children = children

tags = [
    Tag(name='hydrology', full_name='水文', children=[
        Tag(name='waves', full_name='波浪', children=[]),
        Tag(name='hydrodynamics', full_name='水动力', children=[]),
    ]),
    Tag(name='morphology', full_name='地貌', children=[
        Tag(name='sediment', full_name='泥沙', children=[]),
        Tag(name='bathymetry', full_name='地形', children=[]),
    ]),
    Tag(name='ecology', full_name='生态', children=[
        Tag(name='vegetation', full_name='植物', children=[]),
        # Tag(name='animals', full_name='动物', children=[]),
    ]),
    Tag(name='chemistry', full_name='化学', children=[
        Tag(name='ph', full_name='PH', children=[]),
    ]),
    Tag(name='biology', full_name='生物', children=[
        Tag(name='nocturnal', full_name='夜栖', children=[]),
        Tag(name='fish', full_name='渔类', children=[]),
    ]),
    Tag(name='remote-sensing', full_name='遥感', children=[
        Tag(name='algae-bloom', full_name='藻华', children=[]),
        Tag(name='satellite-image', full_name='卫片', children=[]),
    ]),
]

def init_tags(tags: List[Tag], parent: Union[DatasetTag, None]):
    for tag in tags:
        dt = DatasetTag(name=tag.name, full_name=tag.full_name, parent=parent)
        dt.save()
        print(dt)
        if tag.children and len(tag.children) > 0:
            init_tags(tag.children, dt)

if __name__ == '__main__':
    dt: DatasetTag
    for dt in DatasetTag.objects.all():
        dt.delete()

    init_tags(tags, None)