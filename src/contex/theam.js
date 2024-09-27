import React, { createContext, useState } from 'react';


export const ThemeContext = createContext();


export const Theamprovider = ({children})=>{

    const [theme, setTheme] = useState('gray'); // Default to gray theme

    const toggletheam = ()=>{
        setTheme((prevTheme) => (prevTheme === 'gray' ? 'light' : 'gray'));
    }

    return(
     <ThemeContext.Provider value = {{theme,setTheme,toggletheam}}>

     {children}
     </ThemeContext.Provider>

    )
};



