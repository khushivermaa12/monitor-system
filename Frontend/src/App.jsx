import React from 'react'
import AdminMaintenance from './pages/AdminMaintenance'
import UserMaintenance from './pages/UserMaintenance'
import NotFound from './pages/NotFound'
import AppRoutes from './routes/AppRoutes'
import Logo from './components/Logo'
import LanguageSwitcher from './components/LanguageSwitcher'

const App = () => {
  return (
    <div>
      <div className=" fixed md:top-4 left-4 z-50">
        <Logo />
      </div>
      <div className=" fixed md:top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      <AppRoutes />
    </div>
  )
}

export default App
