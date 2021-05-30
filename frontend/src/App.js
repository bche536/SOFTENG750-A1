import {
  Button,
  Container,
  Typography,
  AppBar,
  Toolbar,
  makeStyles,
} from '@material-ui/core';
import TodoList from './components/TodoList';

import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react';

const useStyles = makeStyles((theme) => ({
  main: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  nav: {
    flexGrow: 1,
  },
}));

function App() {
  const { logout } = useAuth0();

  const classes = useStyles();

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <Typography className={classes.nav} variant="h6">My Todos</Typography>
          <Button variant="outlined" color="secondary" onClick={() => logout()}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Container fixed>
        <Toolbar />
        <main className={classes.main}>
          <TodoList />
        </main>
      </Container>
    </>
  );
}

export default withAuthenticationRequired(App);
