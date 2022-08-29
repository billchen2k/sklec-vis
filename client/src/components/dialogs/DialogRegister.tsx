import {useAppDispatch} from '@/app/hooks';
import {endpoints} from '@/config/endpoints';
import {uiSlice} from '@/store/uiSlice';
import {AccountBalance, AccountBox, AccountCircle, Email, Key, Language, LocalPhone, Map} from '@mui/icons-material';
import {Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Typography} from '@mui/material';
import useAxios from 'axios-hooks';
import {useFormik} from 'formik';
import * as React from 'react';
import * as Yup from 'yup';

export interface IDialogRegisterProps {
    open: boolean;
    onClose: () => void;
}

export interface IRegisterFormData {
    username: string;
    password: string;
    email: string;
    display_name: string;
    retype_password: string;
    affiliation: string;
    country: string;
    phone: string;
    address: string;
    city: string;
    state: string;
}

const fields: Record<keyof IRegisterFormData & string, {
    formLabel: string,
    password?: boolean;
    icon?: React.ReactElement;
    helperText?: string;
}> = {
  username: {
    formLabel: 'Username',
    icon: <AccountCircle />,
  },
  display_name: {
    formLabel: 'Full Name',
    icon: <AccountBox />,
  },
  password: {
    formLabel: 'Password',
    password: true,
    icon: <Key />,
  },
  retype_password: {
    formLabel: 'Confirm Password',
    password: true,
    icon: <Key />,
  },
  email: {
    formLabel: 'Email',
    icon: <Email />,
  },
  phone: {
    formLabel: 'Phone Number',
    icon: <LocalPhone />,
  },

  affiliation: {
    formLabel: 'Affiliation',
    icon: <AccountBalance />,
  },
  country: {
    formLabel: 'Country',
    icon: <Language />,
  },
  address: {
    formLabel: 'Address',
    icon: <Map />,
  },
  state: {
    formLabel: 'Province / State',
    icon: <Map />,
  },
  city: {
    formLabel: 'City',
    icon: <Map />,
  },
};

export default function DialogRegister(props: IDialogRegisterProps) {
  const dispatch = useAppDispatch();
  const [{data, loading, error, response}, execute] = useAxios<any>({
    ...endpoints.postRegister(),
  }, {manual: true});


  const formik = useFormik<IRegisterFormData>({
    initialValues: {
      username: '',
      password: '',
      retype_password: '',
      email: '',
      display_name: '',
      affiliation: '',
      country: '',
      phone: '',
      address: '',
      city: '',
      state: '',
    },
    onSubmit: (values) => {
      delete values.retype_password;
      console.log(JSON.stringify(values, null, 2));
      execute({
        ...endpoints.postRegister(values),
      });
      dispatch(uiSlice.actions.beginLoading('Registering...'));
    },
    validationSchema: Yup.object().shape({
      username: Yup.string().required('This field is required.')
          .max(30, 'Username is too long.')
          .min(3, 'Username is too short.'),
      email: Yup.string().email('Invalid email.')
          .required('This field is required.')
          .max(50, 'Email is too long.'),
      password: Yup.string().required('This field is required')
          .min(3, 'Password is too short')
          .max(40, 'Passowrd is too long.'),
      retype_password: Yup.string()
          .oneOf([Yup.ref('password')], 'Password not match.'),
      phone: Yup.string().matches(/^(\+?\d{0,4})?\s?-?\s?(\(?\d{3}\)?)\s?-?\s?(\(?\d{3}\)?)\s?-?\s?(\(?\d{4}\)?)?$/,
          'Invalid phone number.'),
    }),
  });

  React.useEffect(() => {
    if (!loading) {
      dispatch(uiSlice.actions.endLoading());
      if (!error && data) {
        if (response.status == 200) {
          // Successfully registered.
          dispatch(uiSlice.actions.openSnackbar({
            severity: 'success',
            message: `Successfully registered ${formik.values.username}. You can log in now.`,
          }));
          props.onClose();
        }
      }
    }
  }, [error, loading, data, dispatch, response]);
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      maxWidth={'xl'}
    >
      <DialogTitle>
        Register
        {loading &&
            <CircularProgress variant={'indeterminate'} size={'1rem'} sx={{ml: 1}}/>
        }
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
            Welcome. You need to register an account to view some datasets.
        </DialogContentText>
        <Box sx={{display: 'flex', flexWrap: 'wrap', width: '40rem', justifyContent: 'space-between'}}>
          {Object.keys(fields).map((fieldName: keyof IRegisterFormData) => {
            const field = fields[fieldName];
            return (
              <Box sx={{display: 'flex', alignItems: 'flex-start', width: '19rem', paddingBottom: '2px'}} key={`register-field-${fieldName}`}>
                <Box sx={{display: 'flex', color: 'action.active', mr: 1, mt: 2}}>
                  {field.icon}
                </Box>

                <TextField value={formik.values[fieldName]} fullWidth
                  onChange={formik.handleChange}
                  label={field.formLabel}
                  name={fieldName}
                  type={field.password && 'password' || 'text'}
                  variant={'standard'}
                  helperText={formik.errors[fieldName] || field.helperText}
                  error={Boolean(formik.errors[fieldName])}
                />

              </Box>
            );
          })}
        </Box>

      </DialogContent>
      <DialogActions>
        {!loading && error &&
        <Typography variant={'body2'} color={'error'}>
            Fail to register: {error.message}
        </Typography>
        }
        <Button onClick={() => {
          formik.submitForm();
        }}
        disabled={loading}
        >
            Register
        </Button>
      </DialogActions>
    </Dialog>
  );
}
