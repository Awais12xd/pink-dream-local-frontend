'use client'
import { useEffect, useMemo, useState } from 'react'
import dynamic from "next/dynamic";
import { motion } from 'framer-motion'
import {
  CreditCard,
  CheckCircle,
  Landmark,
  Banknote,
  Loader2,
  Upload,
  X,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'react-toastify'

const CheckoutForm = dynamic(() => import("./CheckoutForm"));
const PayPalButton = dynamic(() => import("./PayPalButton"));

const DEFAULT_METHODS = {
  stripe: { enabled: true },
  paypal: { enabled: true },
  cod: { enabled: false },
  bankTransfer: { enabled: false, instructions: "" },
}

const RECEIPT_MAX_SIZE_MB = 5
const RECEIPT_ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export default function PaymentSelector({
  amount,
  amountBreakdown,
  orderId,
  userId,
  cartItems,
  shippingAddress,
  onSuccess,
  onError,
  isLoading,
  paymentMethods = DEFAULT_METHODS,
}) {
  const methods = paymentMethods || DEFAULT_METHODS
  const [offlineLoading, setOfflineLoading] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState('')

  const [bankReceiptFile, setBankReceiptFile] = useState(null)
  const [bankReceiptPreview, setBankReceiptPreview] = useState('')
  const [bankReceiptError, setBankReceiptError] = useState('')

  const enabledMethods = useMemo(() => {
    const order = ['stripe', 'paypal', 'cod', 'bankTransfer']
    return order.filter((k) => methods?.[k]?.enabled)
  }, [methods])

  useEffect(() => {
    if (!enabledMethods.length) {
      setSelectedMethod('')
      return
    }
    if (!enabledMethods.includes(selectedMethod)) {
      setSelectedMethod(enabledMethods[0])
    }
  }, [enabledMethods, selectedMethod])

  useEffect(() => {
    if (!bankReceiptFile) {
      setBankReceiptPreview('')
      return
    }
    const objectUrl = URL.createObjectURL(bankReceiptFile)
    setBankReceiptPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [bankReceiptFile])

  const validateShippingAddress = () => {
    const requiredFields = [
      "name",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "zipCode",
      "country",
    ]

    return requiredFields.every((field) =>
      String(shippingAddress?.[field] || "").trim().length > 0,
    )
  }

  const handleBankReceiptChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!RECEIPT_ALLOWED_TYPES.includes(file.type)) {
      setBankReceiptError('Only JPG, PNG, and WEBP files are allowed.')
      setBankReceiptFile(null)
      return
    }

    if (file.size > RECEIPT_MAX_SIZE_MB * 1024 * 1024) {
      setBankReceiptError(`Receipt image must be <= ${RECEIPT_MAX_SIZE_MB}MB.`)
      setBankReceiptFile(null)
      return
    }

    setBankReceiptError('')
    setBankReceiptFile(file)
  }

  const resetBankReceipt = () => {
    setBankReceiptFile(null)
    setBankReceiptError('')
  }

  const uploadBankTransferReceipt = async ({
    orderIdentifier,
    receiptUploadToken,
  }) => {
    const formData = new FormData()
    formData.append("receiptImage", bankReceiptFile)
    formData.append("receiptUploadToken", receiptUploadToken)

    const uploadRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/payment/offline/upload-receipt/${orderIdentifier}`,
      {
        method: "POST",
        body: formData,
      },
    )

    const uploadData = await uploadRes.json().catch(() => ({}))
    if (!uploadRes.ok || !uploadData.success) {
      throw new Error(uploadData.message || "Failed to upload bank transfer receipt")
    }

    return uploadData
  }

  const createOfflineOrder = async (method) => {
    if (!validateShippingAddress()) {
      toast.error("Fill all required shipping fields.")
      return
    }

    const isBankTransfer = method === 'bankTransfer'

    if (isBankTransfer && !bankReceiptFile) {
      setBankReceiptError("Receipt image is required for bank transfer.")
      toast.error("Please upload your transfer receipt.")
      return
    }

    setOfflineLoading(true)

    try {
      const paymentMethod = isBankTransfer ? 'bank_transfer' : 'cod'

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/offline/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          userId,
          items: cartItems,
          shippingAddress,
          billingAddress: shippingAddress,
          amount: amountBreakdown || {
            subtotal: cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
            shipping: cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0) > 75 ? 0 : 9.99,
            tax: cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0) * 0.08,
            discount: 0,
            total: amount,
          },
          paymentMethod,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to place offline order')
      }

      let finalOrder = data.order

      if (isBankTransfer) {
        const orderIdentifier = data?.order?._id || data?.order?.orderId
        const uploadToken = data?.payment?.receiptUploadToken

        if (!orderIdentifier || !uploadToken) {
          throw new Error("Unable to start receipt upload. Please try again.")
        }

        const uploadData = await uploadBankTransferReceipt({
          orderIdentifier,
          receiptUploadToken: uploadToken,
        })

        finalOrder = uploadData.order || finalOrder
        toast.success("Bank transfer proof submitted. Payment verification is pending.")
      } else {
        toast.success('Order placed successfully')
      }

      onSuccess?.(
        finalOrder,
        {
          id: data?.payment?.reference || `offline_${paymentMethod}`,
          method: selectedMethod,
        },
      )
    } catch (err) {
      toast.error(err.message || 'Failed to place order')
      onError?.(err)
    } finally {
      setOfflineLoading(false)
    }
  }

  const methodConfig = {
    stripe: {
      title: 'Credit or Debit Card',
      desc: 'Visa, Mastercard, American Express',
      icon: <CreditCard className="w-6 h-6" />,
      activeCls: 'border-pink-500 bg-pink-50 ring-2 ring-pink-500 ring-opacity-20',
      idleCls: 'border-gray-300 hover:border-pink-300 bg-white',
      iconActiveCls: 'bg-pink-500 text-white',
      iconIdleCls: 'bg-gray-100',
    },
    paypal: {
      title: 'PayPal',
      desc: 'Pay with your PayPal account',
      icon: <span className="font-bold text-xs">PayPal</span>,
      activeCls: 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-20',
      idleCls: 'border-gray-300 hover:border-blue-300 bg-white',
      iconActiveCls: 'bg-blue-600 text-white',
      iconIdleCls: 'bg-gray-100 text-blue-600',
    },
    cod: {
      title: 'Cash on Delivery',
      desc: 'Pay when your order arrives',
      icon: <Banknote className="w-6 h-6" />,
      activeCls: 'border-green-500 bg-green-50 ring-2 ring-green-500 ring-opacity-20',
      idleCls: 'border-gray-300 hover:border-green-300 bg-white',
      iconActiveCls: 'bg-green-600 text-white',
      iconIdleCls: 'bg-gray-100',
    },
    bankTransfer: {
      title: 'Bank Transfer',
      desc: 'Transfer manually and upload your receipt',
      icon: <Landmark className="w-6 h-6" />,
      activeCls: 'border-amber-500 bg-amber-50 ring-2 ring-amber-500 ring-opacity-20',
      idleCls: 'border-gray-300 hover:border-amber-300 bg-white',
      iconActiveCls: 'bg-amber-600 text-white',
      iconIdleCls: 'bg-gray-100',
    },
  }

  if (!enabledMethods.length) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-red-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Payment Methods Available</h3>
        <p className="text-sm text-gray-600">No payment method is enabled right now. Please contact support.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Method</h2>
        <div className="grid grid-cols-1 gap-4">
          {enabledMethods.map((method) => {
            const cfg = methodConfig[method]
            const isSelected = selectedMethod === method
            return (
              <motion.div
                key={method}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedMethod(method)}
                className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${isSelected ? cfg.activeCls : cfg.idleCls}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${isSelected ? cfg.iconActiveCls : cfg.iconIdleCls}`}>{cfg.icon}</div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">{cfg.title}</h3>
                      <p className="text-gray-600 text-sm">{cfg.desc}</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-pink-500 bg-pink-500' : 'border-gray-300'
                  }`}>
                    {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      <motion.div
        key={selectedMethod}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        {selectedMethod === 'stripe' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-pink-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Credit Card Payment</h3>
            <CheckoutForm
              amount={amount}
              orderId={orderId}
              userId={userId}
              cartItems={cartItems}
              shippingAddress={shippingAddress}
              onSuccess={onSuccess}
              onError={onError}
              isLoading={isLoading}
            />
          </div>
        )}

        {selectedMethod === 'paypal' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">PayPal Payment</h3>
            <PayPalButton
              amount={amount}
              orderId={orderId}
              userId={userId}
              cartItems={cartItems}
              shippingAddress={shippingAddress}
              onSuccess={onSuccess}
              onError={onError}
            />
          </div>
        )}

        {selectedMethod === 'cod' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Cash on Delivery</h3>
            <p className="text-sm text-gray-600 mb-4">You will pay at delivery time.</p>
            <button
              onClick={() => createOfflineOrder('cod')}
              disabled={offlineLoading || isLoading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {offlineLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Place COD Order
            </button>
          </div>
        )}

        {selectedMethod === 'bankTransfer' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-200 space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <AlertCircle className="w-5 h-5 text-amber-700 mt-0.5" />
              <p className="text-sm text-amber-800">
                Transfer exactly <span className="font-semibold">${Number(amount || 0).toFixed(2)}</span> and upload receipt proof.
                Admin will verify before marking payment as succeeded.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Bank Transfer Details</h3>
              <div className="text-sm text-gray-700 whitespace-pre-line rounded-lg border border-gray-200 bg-gray-50 p-4">
                {methods?.bankTransfer?.instructions || 'Bank instructions are not configured.'}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Upload Transfer Receipt</h4>
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 bg-white">
                {!bankReceiptFile ? (
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">
                      JPG, PNG, WEBP (max {RECEIPT_MAX_SIZE_MB}MB)
                    </p>
                    <input
                      id="bank-receipt-file"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={handleBankReceiptChange}
                    />
                    <label
                      htmlFor="bank-receipt-file"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Receipt
                    </label>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bankReceiptPreview ? (
                      <img
                        src={bankReceiptPreview}
                        alt="Bank transfer receipt preview"
                        className="w-full max-h-64 object-contain rounded-lg border border-gray-200 bg-gray-50"
                      />
                    ) : null}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-600 truncate">
                        {bankReceiptFile.name} ({(bankReceiptFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                      <button
                        type="button"
                        onClick={resetBankReceipt}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        <X className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {bankReceiptError ? (
                <p className="text-sm text-red-600 mt-2">{bankReceiptError}</p>
              ) : null}
            </div>

            <button
              onClick={() => createOfflineOrder('bankTransfer')}
              disabled={offlineLoading || isLoading || !bankReceiptFile}
              className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {offlineLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Submit Proof & Place Bank Transfer Order
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
