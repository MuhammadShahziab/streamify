import { Loader } from 'lucide-react'

const LoadingOverLay = () => {
  return (
    <div className='min-h-screen flex justify-center items-center' >
        <Loader className='animate-spin size-14 text-primary'/>
    </div>
  )
}

export default LoadingOverLay