import { Loader } from 'lucide-react'

const LoadingOverLay = () => {
  return (
    <div className='min-h-screen flex justify-center items-center' data-theme="night">
        <Loader className='animate-spin size-14 text-primary'/>
    </div>
  )
}

export default LoadingOverLay