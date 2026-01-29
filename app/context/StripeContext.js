'use client'
import { createContext, useContext } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

const StripeContext = createContext()

export const useStripeContext = () => {
    const context = useContext(StripeContext)
    if (!context) {
        throw new Error('useStripeContext must be used within a StripeProvider')
    }
    return context
}

export const StripeProvider = ({ children }) => {
    const value = {
        // Add any stripe-related functions here if needed
    }

    return (
        <StripeContext.Provider value={value}>
            <Elements 
                stripe={stripePromise}
                options={{
                    appearance: {
                        theme: 'stripe',
                        variables: {
                            colorPrimary: '#ec4899',
                        },
                    },
                }}
            >
                {children}
            </Elements>
        </StripeContext.Provider>
    )
}