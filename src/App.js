import LoginForm from './components/login';
import './App.css';
// import NavBar from './components/Navbar';
// import { createBrowserRouter } from 'react-router-dom';
import HomePage from './components/home';

function App() {
  // const router = createBrowserRouter([
  //   {
  //     path: "/",
  //     element: <HomePage />
  //   },
  // ])

  return (

    <>

      <HomePage />
      <LoginForm />

    </>
  );
}

export default App;
