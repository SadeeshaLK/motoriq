import { createContext, useContext, useState } from "react"

const CompareContext = createContext()

export const CompareProvider = ({ children }) => {

  const [compareList, setCompareList] = useState([])

  const addToCompare = (vehicle) => {

    if (compareList.find(v => v._id === vehicle._id)) return

    if (compareList.length >= 3) {
      alert("Maximum 3 vehicles can be compared")
      return
    }

    setCompareList([...compareList, vehicle])
  }

  const removeFromCompare = (id) => {
    setCompareList(compareList.filter(v => v._id !== id))
  }

  const clearCompare = () => setCompareList([])

  return (
    <CompareContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare
      }}
    >
      {children}
    </CompareContext.Provider>
  )
}

export const useCompare = () => useContext(CompareContext)