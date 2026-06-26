import React from 'react'
import abawatLogo from "../assets/abawatLogo.jpg";

const Logo = () => {
    return (
        <div>
            <img className='w-40 h-auto cursor-pointer' src={abawatLogo} alt="logo" />
        </div>
    )
}

export default Logo