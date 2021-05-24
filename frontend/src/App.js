import { Container, Typography, AppBar, Toolbar, makeStyles } from '@material-ui/core';
import TodoList from './components/TodoList';

const useStyles = makeStyles(theme => ({
  main: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch'
  }
}));

function App() {

  const classes = useStyles();

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6">My Todos</Typography>
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

export default App;