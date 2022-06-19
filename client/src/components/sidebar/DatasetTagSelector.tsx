import {useAppDispatch} from '@/app/hooks';
import {endpoints} from '@/config/endpoints';
import {uiSlice} from '@/store/uiSlice';
import {IDatasetTag, IDatasetTagForRender} from '@/types';
import {IModelListResponse} from '@/types/api';
import {Check, Close} from '@mui/icons-material';
import {Box, Checkbox, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, Typography} from '@mui/material';
import useAxios from 'axios-hooks';
import * as React from 'react';
import {DatasetTagBadge} from '../elements/DatasetTagBatch';

export interface IDatasetTagSelectorProps {
    onTagSelectionUpdate?: (tags: IDatasetTag[]) => any;
}


export function DatasetTagSelector(props: IDatasetTagSelectorProps) {
  const dispatch = useAppDispatch();
  const [{data, loading, error}] = useAxios<IModelListResponse<IDatasetTag>>(endpoints.getDatasetTagList());
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (error) {
      dispatch(uiSlice.actions.openSnackbar({
        'severity': 'error',
        'message': `Fail to load tags: ${error.message}`,
      }));
    }
  }, [data, loading, error, dispatch]);

  const getTagListForRender = (tags: IDatasetTag[]): IDatasetTagForRender[] => {
    const tagsForRender: IDatasetTagForRender[] = [];
    tags.forEach((one) => {
      const tagMap = {};
      let level = 0;
      let parent = one.parent;
      while (parent) {
        level += 1;
        parent = parent.parent;
      }
      tagsForRender.push({...one, level: level});
    });
    return tagsForRender;
  };

  const tags: IDatasetTagForRender[] = data && getTagListForRender(data?.results) || [];

  const handleSelectedTagsChange = (changedTags: string[] | string) => {
    setSelectedTags(changedTags as string[]);
    const newTags = tags.filter((one) => changedTags.indexOf(one.uuid) > -1);
    props.onTagSelectionUpdate(newTags);
  };

  const getLevelPlaceholder = (level: number) => {
    let ret = '';
    if (level >= 1) {
      for (let i = 1; i <= level; i++) {
        ret += '  ';
      }
      return ret = '└  ';
    }
    // ret += '─';
    return ret;
  };

  return (
    <Box>
      <Stack direction={'row'} alignItems={'center'}>
        <Typography sx={{mr: 1}} variant={'body1'}>Tags:</Typography>
        <FormControl sx={{flexGrow: 1}}>
          {/* <InputLabel>Tags</InputLabel> */}
          <Select
            multiple
            size={'small'}
            disabled={loading}
            value={selectedTags}
            // label={'Tags'}
            variant={'standard'}
            onChange={(event) => handleSelectedTagsChange(event.target.value)}
            renderValue={(selectedTags) => (
              <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                {selectedTags.map((uuid) => (
                  <DatasetTagBadge key={uuid} tag={tags.find((one) => one.uuid == uuid)} />
                ))}
              </Box>
            )}
          >
            {tags.map((tag, index) => {
              return (
                <MenuItem
                  dense
                  sx={{padding: 0}}
                  key={tag.uuid}
                  value={tag.uuid}
                >
                  <Checkbox size={'small'} checked={selectedTags.map((uuid) => uuid).indexOf(tag.uuid) != -1} />
                  <Typography variant={'body'}>
                    {getLevelPlaceholder(tag.level || 0)}
                    {tag.full_name}
                  </Typography>
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        <IconButton
          onClick={() => handleSelectedTagsChange([])}
        >
          <Close />
        </IconButton>
        <IconButton
          onClick={() => handleSelectedTagsChange([])}
        >
          <Check />
        </IconButton>
      </Stack>
    </Box>
  );
}
