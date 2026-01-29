'use client'
import { createContext, useContext } from 'react'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'

const PayPalContext = createContext()

export const usePayPal = () => {
    const context = useContext(PayPalContext)
    if (!context) {
        throw new Error('usePayPal must be used within a PayPalProvider')
    }
    return context
}

const paypalOptions = {
    "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    currency: "USD",
    intent: "capture",
    components: "buttons,messages",
    commit: true,
    "data-page-type": "checkout"
}

export const PayPalProvider = ({ children }) => {
    console.log('🔵 PayPal Provider loaded:', process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? 'Client ID Found' : 'Client ID Missing')

    return (
        <PayPalContext.Provider value={{}}>
            <PayPalScriptProvider options={paypalOptions}>
                {children}
            </PayPalScriptProvider>
        </PayPalContext.Provider>
    )
}