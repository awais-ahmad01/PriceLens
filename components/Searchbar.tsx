'use client'

import { useState , FormEvent} from 'react'
import { scrapeAndStoreProduct } from '@/lib/actions'

const isValidAmazonProductURL = (url: string)=>{
    try{
        const parsedURL = new URL(url)
        const hostname = parsedURL.hostname

        if(
            hostname.includes('daraz.com') ||
            hostname.includes('daraz.') ||
            hostname.endsWith('daraz') 
        ){
            return true
        }
    }
    catch(error){
        return false
    }

    return false
}


const Searchbar = () => {

    const [searchPrompt, setSearchPrompt] = useState('')
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (event: FormEvent<HTMLFormElement>)=>{
        event.preventDefault();

        const isValidLink = isValidAmazonProductURL(searchPrompt);

        if(!isValidLink){
            alert('Please enter valid Daraz link!!');
        }

       try {
      setIsLoading(true);

      // Scrape the product page
      const product = await scrapeAndStoreProduct(searchPrompt);
      console.log("Product:", product)
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
}



  return (
    <form 
        onSubmit={onSubmit}
        className='flex flex-wrap gap-4 mt-12'    
    >
        <input 
        type="text"
        value={searchPrompt}
        onChange={e => setSearchPrompt(e.target.value)}
        placeholder='Enter product link'
        className='searchbar-input'
        />

        <button
         type='submit'
         className='searchbar-btn'
         disabled={searchPrompt === ''}
        >
            {isLoading ? 'searching': 'search'}
        </button>
    </form>
  )
}

export default Searchbar