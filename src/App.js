import LoginForm from './components/login';
import './App.css';
import NavBar from './components/Navbar';
import { createBrowserRouter } from 'react-router-dom';
import Home from './components/home';

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />
    },
  ])

  return (

    <>

      <NavBar />
      <LoginForm />

    </>
  );
}

export default App;
