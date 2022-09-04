import {endpoints} from '@/config/endpoints';
import TagStore from '@/lib/tagStore';
import {IDatasetTag} from '@/types';
import {IModelListResponse} from '@/types/api';
import {Tag} from '@mui/icons-material';
import {Box, Checkbox, LinearProgress, List, ListItem, ListItemButton, ListItemIcon, ListItemText} from '@mui/material';
import useAxios from 'axios-hooks';
import _ from 'lodash';
import * as React from 'react';
import {DatasetTagBadge} from './DatasetTagBatch';

export interface ITagSelectorProps {
  onTagSelected?: (tags: IDatasetTag[], displayName?: string) => any;
  maxHeight?: number;
  alreadySelectedTags?: string[];
}

export default function TagSelector(props: ITagSelectorProps) {
  const [{data, loading, error}] = useAxios<IModelListResponse<IDatasetTag>>(endpoints.getDatasetTagList());
  // if (props.alreadySelectedTags) {
  const currentSelectedTags = props.alreadySelectedTags || [];
  // } else {
  //   try {
  //     currentSelectedTags = JSON.parse(localStorage.getItem('selectedTags') || '[]');
  //   } catch {
  //     console.warn('Current selected tags in localStorage is in invalid format.');
  //   };
  // }
  const [selectedTags, setSelectedTags] = React.useState<string[]>(currentSelectedTags);
  const [selectedTagsObj, setSelectedTagsObj] = React.useState<IDatasetTag[]>([]);
  const tagStore = React.useRef<TagStore>(undefined);
  const [allTags, setAllTags] = React.useState<IDatasetTag[]>([]);

  React.useEffect(() => {
    if (!loading && !error && data) {
      tagStore.current = new TagStore(data.results);
      //   console.log(tagStore.current.tagFullName('37614b073'));
      //   console.log(tagStore.current.getParentTag('37614b073'));
      //   console.log(tagStore.current.getChildTags('37614b073'));
      setAllTags(tagStore.current.getAllTags());
    }
  }, [data, loading, error]);

  const handleSelectTag = (tag: IDatasetTag) => {
    const uuid = tag.uuid;
    const alreadySelected = selectedTags.indexOf(uuid) > -1;
    console.log(alreadySelected);
    let newSelectedTags = [];
    if (alreadySelected) {
      // Uncheck tag. This tag and all of its children will be unselected too.
      const tagToUnselect = _.concat([uuid], tagStore.current?.getChildTags(uuid).map((one) => one.uuid));
      //   console.log('Tag to unselect', tagToUnselect);
      //   console.log('Target', _.difference(selectedTags, tagToUnselect));
      newSelectedTags = _.difference(selectedTags, tagToUnselect);
    } else {
      // Check the tag. This tag and all of its children will be selected too.
      const tagToSelect = _.concat([uuid], tagStore.current?.getChildTags(uuid).map((one) => one.uuid));
      //   console.log('Tag to select', tagToSelect);
      //   console.log('Target', _.union(tagToSelect, selectedTags));
      newSelectedTags = _.union(tagToSelect, selectedTags);
    }
    setSelectedTags(newSelectedTags);
    const newSelectedTagsObj = newSelectedTags.map((one) => tagStore.current.getTag(one));
    if (newSelectedTags.length > 0) {
      props.onTagSelected(newSelectedTagsObj, tagStore.current.tagFullName(newSelectedTags[0]) + (newSelectedTags.length > 1 ? '...' : ''));
      // !props.alreadySelectedTags && localStorage.setItem('selectedTags', JSON.stringify(newSelectedTags));
    } else {
      props.onTagSelected([], null);
      // localStorage.setItem('selectedTags', JSON.stringify([]));
    }
  };


  return (
    <Box sx={{width: 250, maxHeight: props.maxHeight || 500, overflowY: 'scroll'}}>
      {!tagStore.current &&
        <LinearProgress variant={'indeterminate'} sx={{width: '100%'}} />
      }
      <List
        dense
        disablePadding
      >
        {allTags.map((one) => (
          <ListItem key={one.uuid} dense
            sx={{padding: 0}}
          >
            <Checkbox size={'small'}
              checked={selectedTags.indexOf(one.uuid) != -1}
              onChange={() => handleSelectTag(one)}
            />
            <ListItemButton
              selected={selectedTags.indexOf(one.uuid) != -1}
              onClick={() => handleSelectTag(one)}
            >
              <ListItemText primary={
                <DatasetTagBadge tag={one} displayName={(one.level > 0 ? '/ ' : '') + one.full_name}/>
              } sx={{px: one.level * 3}} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
