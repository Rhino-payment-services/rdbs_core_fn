"use client"
import Link from 'next/link'
import React from 'react'

const Navbar = () => {
  return (
    <nav className='flex justify-between items-center p-4'>
      <div className='w-[100px] py-2 flex items-center justify-center    border-black border-1 rounded-[10px]'>
        <span className='text-black text-center'>Rukapay </span>
      </div>
      <div className='flex flex-row gap-[10px] items-center'></div>
      <div className='flex items-center gap-2'>
        <Link href='/contact' className='bg-black text-white px-4 py-2 rounded-[10px]'>Dashboard</Link>
      </div>
    </nav>
  )
}

export default Navbar