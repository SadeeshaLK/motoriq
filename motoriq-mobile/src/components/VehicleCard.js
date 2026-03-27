import { View, Text, Image, TouchableOpacity } from "react-native";
import API from "../services/api";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { calculateMonthlyCost } from "../utils/calculateMonthlyCost";

export default function VehicleCard({
  vehicle,
  compareList,
  setCompareList,
  monthlyBudget,
  addToCompare
}) {
  const router = useRouter();

  const estimatedMonthly = calculateMonthlyCost(vehicle);

  const isCityFriendly =
    vehicle.fuelEfficiency > 18 &&
    vehicle.mileage < 80000 &&
    vehicle.maintenanceLevel === "low";

  // SELLER RATING
  let sellerRating = null;

  if (vehicle.user) {
    if (vehicle.user.rating) {
      sellerRating = vehicle.user.rating;
    } else if (vehicle.trustScore) {
      sellerRating = Math.min(5, vehicle.trustScore / 20).toFixed(1);
    } else {
      sellerRating = 3.5;
    }
  }

  // IMAGE LOGIC
  let imageUrl = "https://via.placeholder.com/300";

  if (vehicle.images && vehicle.images.length > 0) {
    let firstImage = vehicle.images[0];

    if (firstImage.startsWith("/")) {
      firstImage = firstImage.slice(1);
    }

    if (firstImage.startsWith("http")) {
      imageUrl = firstImage;
    } else {
      imageUrl = `https://motoriq-lk.onrender.com/${firstImage}`;
    }
  }

  return (
    <TouchableOpacity
      onPress={() => router.push(`/vehicle/${vehicle._id}`)}
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        marginBottom: 15,
        overflow: "hidden",
        elevation: 3,
      }}
    >
      {/* IMAGE */}
      <Image
        source={{ uri: imageUrl }}
        style={{ width: "100%", height: 180 }}
        resizeMode="cover"
      />

      <View style={{ padding: 12 }}>
        {/* TITLE */}
        <Text style={{ fontWeight: "bold", fontSize: 16 }}>
          {vehicle.brand} {vehicle.model} {vehicle.manufacturedYear}
        </Text>

        {/* LOCATION */}
        <Text style={{ fontSize: 12, color: "gray", marginTop: 3 }}>
          📍 {vehicle.city || vehicle.district || "Location not specified"}
        </Text>

        {/* SELLER RATING */}
        {sellerRating && (
          <Text
            style={{
              marginTop: 5,
              backgroundColor: "#facc15",
              padding: 4,
              borderRadius: 5,
              alignSelf: "flex-start",
            }}
          >
            ⭐ {sellerRating}
          </Text>
        )}

        {/* PRICE */}
        <Text
          style={{
            color: "#ff6600",
            fontWeight: "bold",
            fontSize: 18,
            marginTop: 5,
          }}
        >
          LKR {vehicle.price?.toLocaleString()}
        </Text>

        {/* DETAILS */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 5 }}>
          <Text style={badge}>🛣 {vehicle.mileage?.toLocaleString()} km</Text>
          {vehicle.transmission && (
            <Text style={badge}>⚙ {vehicle.transmission}</Text>
          )}
          {vehicle.fuelType && (
            <Text style={badge}>⛽ {vehicle.fuelType}</Text>
          )}
          {vehicle.engineCapacity && (
            <Text style={badge}>🔧 {vehicle.engineCapacity}cc</Text>
          )}
        </View>

        {/* DEAL */}
        {vehicle.dealScore > 20 && (
          <Text style={[badge, { backgroundColor: "green", color: "#fff" }]}>
            🔥 Best Deal
          </Text>
        )}

        {/* TRUST */}
        <Text style={[badge, { backgroundColor: "#eee" }]}>
          Trust: {vehicle.trustScore ?? 0}/100
        </Text>

        {/* MONTHLY */}
        <Text style={[badge, { backgroundColor: "#dbeafe" }]}>
          Monthly: LKR {estimatedMonthly?.toLocaleString()}
        </Text>

        {/* BUDGET */}
        {estimatedMonthly <= monthlyBudget && (
          <Text style={[badge, { backgroundColor: "#dcfce7" }]}>
            Within Budget
          </Text>
        )}

        {/* CITY FRIENDLY */}
        {isCityFriendly && (
          <Text style={[badge, { backgroundColor: "green", color: "#fff" }]}>
            City Friendly
          </Text>
        )}

        {/* BUTTONS */}
        <View style={{ flexDirection: "row", marginTop: 10 }}>
          <TouchableOpacity
            onPress={async (e) => {
              try {
                const token = await AsyncStorage.getItem("token");

                await API.post(
                  `/users/favorite/${vehicle._id}`,
                  {},
                  { headers: { Authorization: token } }
                );
              } catch (err) {
                console.log(err);
              }
            }}
            style={btn}
          >
            <Text>❤️ Favorite</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => addToCompare(vehicle)}
            style={btn}
          >
            <Text>⚖ Compare</Text>
          </TouchableOpacity>
        </View>

      </View>
    </TouchableOpacity>
  );
}

const badge = {
  backgroundColor: "#f1f5f9",
  padding: 5,
  borderRadius: 5,
  marginRight: 5,
  marginTop: 5,
  fontSize: 12,
};

const btn = {
  backgroundColor: "#eee",
  padding: 8,
  borderRadius: 6,
  marginRight: 10,
};