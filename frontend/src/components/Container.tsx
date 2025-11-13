import React from 'react'

const Container = ({children}: {children: React.ReactNode}) => {
  return (
     <div className="p-4 sm:p-6 lg:p-8 h-full">
      <div className="container mx-auto space-y-10">
        {children}
        </div>
    </div>
  )
}

export default Container