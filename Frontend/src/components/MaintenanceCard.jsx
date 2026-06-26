import React from 'react'
import ServiceIcons from './ServiceIcons'

const MaintenanceCard = ({ title, message, children }) => {
  return (
    <div className='min-h-screen bg-white flex flex-col items-center justify-center px-4 py-6 gap-4'>
      <div className='w-full max-w-2xl rounded-3xl border border-cyan-500 bg-white p-10 text-center'>
        <h1 className='text-5xl font-bold text-[#373684] mb-6 tracking-wide'>{title}</h1>
        <p className='text-zinc-600 text-lg leading-relaxed mb-8'>{message}</p>
        <div className='flex items-center justify-center mb-8'>
          <ServiceIcons />
        </div>
        {children}
      </div>
    </div>
  )
}

export default MaintenanceCard
