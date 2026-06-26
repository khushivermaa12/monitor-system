import React from 'react'
import {Routes, Route} from 'react-router-dom'
import AdminMaintenance from '../pages/AdminMaintenance'
import UserMaintenance from '../pages/UserMaintenance'
import NotFound from '../pages/NotFound'

const AppRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path='/admin/maintenance' element={<AdminMaintenance/>}/>
        <Route path='/user/maintenance' element={<UserMaintenance/>}/>
        <Route path='*' element={<NotFound/>}/>
      </Routes>
    </div>
  )
}

export default AppRoutes
