import {endpoints} from '@/config/endpoints';
import TagStore from '@/lib/tagStore';
import {IDatasetTag} from '@/types';
import {IModelListResponse, IResponse} from '@/types/api';
import {Add, Close, Delete} from '@mui/icons-material';
import {Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, Grid, IconButton, InputAdornment, List, ListItem, ListItemButton, ListItemText, Stack, TextField, Tooltip, Typography} from '@mui/material';
import useAxios from 'axios-hooks';
import {useFormik} from 'formik';
import * as React from 'react';
import {DatasetTagBadge} from '../elements/DatasetTagBatch';
import * as Yup from 'yup';
import {useAppDispatch} from '@/app/hooks';
import ParentTagSelectPopover from './ParentTagSelectPopover';
import {uiSlice} from '@/store/uiSlice';
import {siteSlice} from '@/store/siteSlice';

export interface ITagManagerProps {
}

export interface TagPatchFormData {
  name: string;
  full_name: string;
  description: string;
  parent: string;
}
export interface TagPostFormData {
  name: string;
  full_name: string;
  description: string;
  parent?: string;
}


export default function TagManager(props: ITagManagerProps) {
  const dispatch = useAppDispatch();
  const tagStore = React.useRef<TagStore>(undefined);

  const [allTags, setAllTags] = React.useState<IDatasetTag[]>([]);
  const [currentTag, setCurrentTag] = React.useState<| IDatasetTag>(null);
  const [parentSelectOpen, setParentSelectOpen] = React.useState<boolean>(false);
  const [createTagOpen, setCreateTagOpen] = React.useState<boolean>(false);
  const [createParentSelectOpen, setCreateParentSelectOpen] = React.useState<boolean>(false);

  const [{data, loading, error}, getTagExecute] = useAxios<IModelListResponse<IDatasetTag>>(endpoints.getTags());
  const [patchTagAxiosResult, patchTagExecute] = useAxios<IResponse<any>>({}, {manual: true});
  const [deleteTagAxiosResult, deleteTagExecute] = useAxios<IResponse<any>>({}, {manual: true});
  const [postTagAxiosResult, postTagExecute] = useAxios<IResponse<any>>({}, {manual: true});

  const formikPatchTag = useFormik<TagPatchFormData>({
    initialValues: {
      name: 'loading',
      full_name: 'loading',
      description: 'loading',
      parent: null,
    },
    validationSchema: Yup.object().shape({
      name: Yup.string().required('This field is required').max(30, 'Tag name is too long.'),
      full_name: Yup.string().required('This field is required').max(30, 'Tag name is too long.'),
      description: Yup.string().nullable().max(200, 'Tag description is too long'),
    }),
    onSubmit: (values) => {
      patchTagExecute({
        ...endpoints.patchTags(currentTag.uuid),
        data: values,
      });
    },
  });

  const formikCreateTag = useFormik<TagPostFormData>({
    initialValues: {
      name: '',
      full_name: '',
      description: '',
      parent: null,
    },
    validationSchema: Yup.object().shape({
      name: Yup.string().required('This field is required').max(30, 'Tag name is too long.'),
      full_name: Yup.string().required('This field is required').max(30, 'Tag name is too long.'),
      description: Yup.string().nullable().max(200, 'Tag description is too long'),
    }),
    onSubmit: (values) => {
      postTagExecute({
        ...endpoints.postCreateTags(),
        data: values,
      });
    },
  });

  const handleSelectTag = (tag: IDatasetTag) => {
    setCurrentTag(tag);
    const values = (({name, full_name, description, parent}) => ({name, full_name, description, parent}))(tag);
    // @ts-ignore
    formikPatchTag.setValues(values);
    // Handle the issue when description is null, formik value won't update.
    formikPatchTag.setFieldValue('description', values.description || '');
  };

  const handleDeleteTag = (uuid: string) => {
    dispatch(uiSlice.actions.openDialog({
      type: 'confirm',
      title: 'Confirm',
      confirmText: 'Delete',
      content: <Typography variant={'body1'}>
        Are you sure to delete the tag {currentTag.full_name} ({currentTag.name})?
        All datasets with this tag will no longer have this tag. This operation is irreversible.
      </Typography>,
      onConfirm: () => {
        deleteTagExecute({...endpoints.deleteTags(currentTag.uuid)});
      },
    }));
  };

  React.useEffect(() => {
    dispatch(siteSlice.actions.setGlobalState('managing'));
  }, []);

  React.useEffect(() => {
    const {loading, error, data} = patchTagAxiosResult;
    if (!loading && !error && data) {
      dispatch(uiSlice.actions.openSnackbar({
        severity: 'success',
        message: 'Tag updated successfully.',
      }));
      // Refresh the dataset list so the change can be noticed in the dataset list.
      dispatch(siteSlice.actions.refreshDatasetList());
      getTagExecute();
    }
    if (!loading && error) {
      dispatch(uiSlice.actions.openSnackbar({
        severity: 'error',
        message: `Fail to update tag: ${error.message}`,
      }));
    }
  }, [patchTagAxiosResult]);

  React.useEffect(() => {
    const {loading, error, data} = postTagAxiosResult;
    if (!loading && !error && data) {
      dispatch(uiSlice.actions.openSnackbar({
        severity: 'success',
        message: `Tag ${formikCreateTag.values.full_name} created successfully.`,
      }));
      getTagExecute();
      setCreateTagOpen(false);
    }
    if (!loading && error) {
      dispatch(uiSlice.actions.openSnackbar({
        severity: 'error',
        message: `Fail to create tag: ${error.message}`,
      }));
    }
  }, [postTagAxiosResult]);

  React.useEffect(() => {
    const {loading, error, data} = deleteTagAxiosResult;
    if (!loading && !error && data) {
      dispatch(uiSlice.actions.openSnackbar({
        severity: 'success',
        message: `Tag deleted successfully.`,
      }));
      getTagExecute();
      dispatch(siteSlice.actions.refreshDatasetList());
      setCurrentTag(null);
    }
    if (!loading && error) {
      dispatch(uiSlice.actions.openSnackbar({
        severity: 'error',
        message: `Fail to delete tag: ${error.message}`,
      }));
    }
  }, [deleteTagAxiosResult]);

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
      <Typography variant={'h4'} sx={{mb: 1}}>Tag Management</Typography>
      <Grid container spacing={2} sx={{width: 600}}>
        <Grid item xs={6}>
          <List
            dense
            disablePadding
            sx={{maxHeight: 500, overflowY: 'scroll'}}
          >

            {allTags.map((one) => (
              <ListItem key={one.uuid} dense
                sx={{padding: 0}}
                secondaryAction={<Stack direction={'row'}>
                  <Tooltip title={'Add child tag'}>
                    <IconButton sx={{width: 12, height: 12}}
                      onClick={() => {
                        setCreateTagOpen(true);
                        formikCreateTag.setValues(formikCreateTag.initialValues);
                        formikCreateTag.setFieldValue('parent', one.uuid);
                      }}
                    >
                      <Add sx={{width: 16, height: 16}} />
                    </IconButton>
                  </Tooltip>

                </Stack>}
              >
                <ListItemButton
                  selected={one.uuid === currentTag?.uuid}
                  onClick={() => handleSelectTag(one)}
                >
                  <ListItemText primary={
                    <Stack direction={'row'}>
                      <DatasetTagBadge tag={one} displayName={(one.level > 0 ? '/ ' : '') + one.full_name} />
                      <Box sx={{display: 'flex', flexGrow: 1}}></Box>
                      <Typography variant={'caption'} sx={{color: 'gray'}}>{one.name}</Typography>
                    </Stack>
                  } sx={{pl: one.level * 3}} />
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem
              secondaryAction={
                <Button variant={'outlined'} size={'small'}
                  onClick={() => {
                    setCreateTagOpen(true);
                    formikCreateTag.setValues(formikCreateTag.initialValues);
                    formikCreateTag.setFieldValue('parent', null);
                  }}
                >
                  Create root tag
                </Button>
              }
            >
              <Box sx={{height: 24}} />
            </ListItem>
          </List>
        </Grid>
        <Grid item xs={6}>
          <Typography variant={'body1'} sx={{fontWeight: 'bold', mb: 2}}>Tag details:</Typography>
          {!currentTag &&
            <Box sx={{display: 'flex', flexGrow: 1, height: 200, alignItems: 'center', justifyContent: 'center'}}>
              <Typography variant={'body1'} sx={{color: 'gray', fontStyle: 'italic'}}>Not selected</Typography>
            </Box>
          }
          {currentTag &&
            <Stack spacing={2}>
              <TextField size={'small'} variant={'standard'} sx={{width: '100%'}}
                name={'name'} label={'Name (Short ID)'}
                value={formikPatchTag.values.name}
                onChange={formikPatchTag.handleChange}
                helperText={formikPatchTag.errors.name}
                error={Boolean(formikPatchTag.errors.name)}
              />
              <TextField size={'small'} variant={'standard'} sx={{width: '100%'}}
                name={'full_name'} label={'Name (Readable)'}
                value={formikPatchTag.values.full_name}
                onChange={formikPatchTag.handleChange}
                helperText={formikPatchTag.errors.full_name}
                error={Boolean(formikPatchTag.errors.full_name)}
              />
              <TextField size={'small'} variant={'standard'} sx={{width: '100%'}}
                multiline rows={3}
                name={'description'} label={'Description'}
                value={formikPatchTag.values.description}
                onChange={formikPatchTag.handleChange}
                helperText={formikPatchTag.errors.description}
                error={Boolean(formikPatchTag.errors.description)}
              />
              <TextField id={'textfiled-parenttag-edit'}
                size={'small'} variant={'standard'} sx={{width: '100%'}} label={'Parent Tag'}
                placeholder={'Click to edit'}
                onClick={() => setParentSelectOpen(true)}
                helperText={'Set empty (No parent tag) will make it a root tag.'}
                value={''}
                InputProps={{
                  startAdornment: formikPatchTag.values.parent && <InputAdornment position={'start'}>
                    <DatasetTagBadge tag={
                      tagStore.current.getTag(formikPatchTag.values.parent)}
                    />
                  </InputAdornment>,
                  endAdornment: <IconButton onClick={() => {
                    formikPatchTag.setFieldValue('parent', null);
                  }}
                  >
                    <Close />
                  </IconButton>,
                }}
              />
              <Stack direction={'row'} spacing={1} alignItems={'center'}>
                <Box sx={{display: 'flex', flexGrow: 1}} />
                {patchTagAxiosResult.loading &&
                  <CircularProgress variant={'indeterminate'} size={'1rem'} sx={{mr: 1}} />
                }
                <Button variant={'outlined'} size={'small'} color={'error'}
                  disabled={patchTagAxiosResult.loading || deleteTagAxiosResult.loading}
                  onClick={() => handleDeleteTag(currentTag.uuid)}
                >
                  Delete
                </Button>
                <Button variant={'outlined'} size={'small'}
                  disabled={patchTagAxiosResult.loading || deleteTagAxiosResult.loading}
                  onClick={() => {
                    formikPatchTag.submitForm();
                  }}
                >
                  Update
                </Button>
              </Stack>
              <ParentTagSelectPopover
                anchorElId={'textfiled-parenttag-edit'}
                open={parentSelectOpen} onClose={() => setParentSelectOpen(false)}
                onParentTagSelected={(tag) => {
                  if (tag.uuid === currentTag.uuid) {
                    dispatch(uiSlice.actions.openDialog({
                      type: 'simple',
                      title: 'Error',
                      content: <Typography variant={'body1'}>
                        The tags&apos;s parent tag can not be itself. Please specify another value.
                      </Typography>,
                    }));
                    formikPatchTag.setFieldValue('parent', null);
                  } else {
                    formikPatchTag.setFieldValue('parent', tag.uuid);
                  }
                }}
              />
            </Stack>
          }
        </Grid>
      </Grid>
      <Dialog open={createTagOpen}
        onClose={() => setCreateTagOpen(false)}
      >
        <DialogTitle>Create Tag</DialogTitle>
        <DialogContent sx={{width: 300}}>
          <Stack spacing={2}>
            <TextField size={'small'} variant={'standard'} sx={{width: '100%'}}
              name={'name'} label={'Name (Short ID)'}
              value={formikCreateTag.values.name}
              onChange={formikCreateTag.handleChange}
              helperText={formikCreateTag.errors.name}
              error={Boolean(formikCreateTag.errors.name)}
            />
            <TextField size={'small'} variant={'standard'} sx={{width: '100%'}}
              name={'full_name'} label={'Name (Readable)'}
              value={formikCreateTag.values.full_name}
              onChange={formikCreateTag.handleChange}
              helperText={formikCreateTag.errors.full_name}
              error={Boolean(formikCreateTag.errors.full_name)}
            />
            <TextField size={'small'} variant={'standard'} sx={{width: '100%'}}
              multiline rows={3}
              name={'description'} label={'Description'}
              value={formikCreateTag.values.description}
              onChange={formikCreateTag.handleChange}
              helperText={formikCreateTag.errors.description}
              error={Boolean(formikCreateTag.errors.description)}
            />
            <TextField id={'textfield-parenttag-edit-create'}
              size={'small'} variant={'standard'} sx={{width: '100%'}} label={'Parent Tag'}
              placeholder={'Click to edit'}
              onClick={() => setCreateParentSelectOpen(true)}
              helperText={'Set empty (No parent tag) will make it a root tag.'}
              value={''}
              InputProps={{
                startAdornment: formikCreateTag.values.parent && <InputAdornment position={'start'}>
                  <DatasetTagBadge tag={
                    tagStore.current.getTag(formikCreateTag.values.parent)}
                  />
                </InputAdornment>,
                endAdornment: <IconButton onClick={() => {
                  formikCreateTag.setFieldValue('parent', null);
                }}
                >
                  <Close />
                </IconButton>,
              }}
            />
            <Stack direction={'row'} spacing={1} alignItems={'center'}>
              <Box sx={{display: 'flex', flexGrow: 1}} />
              {postTagAxiosResult.loading &&
                <CircularProgress variant={'indeterminate'} size={'1rem'} sx={{mr: 1}} />
              }
              <Button variant={'outlined'} size={'small'}
                onClick={() => setCreateTagOpen(false)}
              >
                Cancel
              </Button>
              <Button variant={'outlined'} size={'small'}
                disabled={postTagAxiosResult.loading}
                onClick={() => {
                  formikCreateTag.submitForm();
                }}
              >
                Create
              </Button>
            </Stack>
            <ParentTagSelectPopover
              anchorElId={'textfield-parenttag-edit-create'}
              open={createParentSelectOpen} onClose={() => setCreateParentSelectOpen(false)}
              onParentTagSelected={(tag) => {
                if (tag.uuid === currentTag.uuid) {
                  dispatch(uiSlice.actions.openDialog({
                    type: 'simple',
                    title: 'Error',
                    content: <Typography variant={'body1'}>
                      The tags&apos;s parent tag can not be itself. Please specify another value.
                    </Typography>,
                  }));
                  formikCreateTag.setFieldValue('parent', null);
                } else {
                  formikCreateTag.setFieldValue('parent', tag.uuid);
                }
              }}
            />
          </Stack>
        </DialogContent>

      </Dialog>
    </Box>
  );
}
