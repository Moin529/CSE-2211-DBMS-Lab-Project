import React from 'react';
import Navbar from './components/Navbar';
import { Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Movies from './pages/Movies';
import MovieDetails from './pages/MovieDetails';
import SeatLayout from './pages/SeatLayout';
import MyBookings from './pages/MyBookings';
import Favorite from './pages/Favorite';
import Theaters from './pages/Theaters';
import Releases from './pages/Releases';
import Dashboard from './pages/admin/Dashboard';
import AddShows from './pages/admin/AddShows';
import ListShows from './pages/admin/ListShows';
import ListBookings from './pages/admin/ListBookings';
import AdminSetup from './pages/AdminSetup';
import { Toaster } from 'react-hot-toast';
import Footer from './components/Footer';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';

const App = () => {

  const isAdminRoute = useLocation().pathname.startsWith('/admin');

  return (
    <>
      <Toaster/>
      {!isAdminRoute && <Navbar/>}
      <Routes>
        <Route path = '/' element = {<Home/>} />
        <Route path = '/movies' element = {<Movies/>} />
        <Route path = '/movies/:id' element = {<MovieDetails/>} />
        <Route path = '/movies/:id/:date' element = {<SeatLayout/>} />
        <Route path = '/my-bookings' element = {<MyBookings/>} />
        <Route path = '/favorite' element = {<Favorite/>} />
        <Route path = '/theaters' element = {<Theaters/>} />
        <Route path = '/releases' element = {<Releases/>} />
        
        {/* Temporary Admin Setup Route - DELETE AFTER SETUP */}
        <Route path = '/admin-setup' element = {<AdminSetup/>} />
        
        {/* Admin Routes - Protected */}
        <Route path = '/admin' element = {
          <ProtectedAdminRoute>
            <Dashboard/>
          </ProtectedAdminRoute>
        } />
        <Route path = '/admin/add-shows' element = {
          <ProtectedAdminRoute>
            <AddShows/>
          </ProtectedAdminRoute>
        } />
        <Route path = '/admin/list-shows' element = {
          <ProtectedAdminRoute>
            <ListShows/>
          </ProtectedAdminRoute>
        } />
        <Route path = '/admin/list-bookings' element = {
          <ProtectedAdminRoute>
            <ListBookings/>
          </ProtectedAdminRoute>
        } />
      </Routes>

      {!isAdminRoute && <Footer/>}
    </>
  );
};

export default App
