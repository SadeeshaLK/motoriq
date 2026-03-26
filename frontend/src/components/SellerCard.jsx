export default function SellerCard() {

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mt-6">

      <div className="flex items-center gap-4">

        <img
          src="https://i.pravatar.cc/100"
          className="w-14 h-14 rounded-full"
        />

        <div>
          <h4 className="font-semibold">
            Samantha
          </h4>
          <p className="text-sm text-gray-500">
            Member Since April 2021
          </p>
        </div>

      </div>

      <button className="mt-4 w-full bg-orange-500 text-white py-2 rounded-lg">
        Contact Seller
      </button>

    </div>
  )
}