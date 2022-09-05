import {endpoints} from '@/config/endpoints';
import TagStore from '@/lib/tagStore';
import {IDatasetTag} from '@/types';
import {IModelListResponse} from '@/types/api';
import {Box, Grid, Typography} from '@mui/material';
import useAxios from 'axios-hooks';
import * as React from 'react';
import TagSelector from '../elements/TagSelector';

export interface ITagManagerProps {
}

export default function TagManager(props: ITagManagerProps) {
  const tagStore = React.useRef<TagStore>(undefined);
  const [{data, loading, error}] = useAxios<IModelListResponse<IDatasetTag>>(endpoints.getDatasetTagList());
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
  return (
    <Box>
      <Typography variant={'h4'}>Tag Management</Typography>
      <Grid container spacing={2} sx={{width: 500}}>
        <Grid item xs={6}>
          <TagSelector />
        </Grid>
        <Grid item xs={6}>
            Tag detail
        </Grid>
      </Grid>
    </Box>
  );
}
