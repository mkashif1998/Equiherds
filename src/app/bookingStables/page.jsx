"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DatePicker, Form, Button, Card, Row, Col, TimePicker, Select, Checkbox, App, Tag, Spin, Alert } from "antd";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import TopSection from "../components/topSection";
import { postRequest, getRequest } from "@/service";
import { getUserData } from "../utils/localStorage";

// Extend dayjs with required plugins
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const { RangePicker } = DatePicker;
const { Option } = Select;

// Component that uses useSearchParams
function BookingStablesContent() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedStable, setSelectedStable] = useState(null);
  const [bookingType, setBookingType] = useState(null); // 'day' or 'week'
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const [bookingAvailability, setBookingAvailability] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);
  const [selectedServices, setSelectedServices] = useState({
    shortTermStay: {
      selected: null
    },
    longTermStay: {
      selected: null
    },
    stallionsAccepted: false,
    eventPricing: {
      eventingCourse: false,
      canterTrack: false,
      jumpingTrack: false,
      dressageTrack: false
    }
  });
  const searchParams = useSearchParams();
  const { notification } = App.useApp();

  // Fetch stable data and set selected stable
  useEffect(() => {
    const fetchStableData = async () => {
      if (searchParams) {
        const stableId = searchParams.get('stableId');
        if (stableId) {
          try {
            setLoading(true);
            const response = await getRequest(`/api/stables/${stableId}`);
            
            if (response && response._id) {
              // Normalize the API response data
              const normalizedData = {
                stableId: response._id,
                title: response.Tittle || "Untitled Stable",
                details: response.Deatils || "",
                rating: response.Rating || 0,
                images: Array.isArray(response.image) && response.image.length > 0 ? response.image : ["/product/1.jpg"],
                location: response.location || "",
                coordinates: response.coordinates || null,
                userId: response.userId || null,
                ownerName: response.userId ? `${response.userId.firstName || ''} ${response.userId.lastName || ''}`.trim() : '',
                ownerEmail: response.userId?.email || '',
                slots: Array.isArray(response.Slotes)
                  ? response.Slotes.map((sl) => ({ 
                      date: sl?.date || '', 
                      startTime: sl?.startTime || '', 
                      endTime: sl?.endTime || '' 
                    }))
                  : [],
                status: response.status || "active",
                // Handle PriceRate - can be array or object
                priceRates: [],
                price: 0,
                // New pricing fields
                shortTermStay: response.shortTermStay || {
                  inStableStraw: false,
                  inStableShavings: false,
                  inFieldAlone: false,
                  inFieldHerd: false,
                  inStableStrawPrice: 0,
                  inStableShavingsPrice: 0,
                  inFieldAlonePrice: 0,
                  inFieldHerdPrice: 0
                },
                longTermStay: response.longTermStay || {
                  inStableStraw: false,
                  inStableShavings: false,
                  inFieldAlone: false,
                  inFieldHerd: false,
                  inStableStrawPrice: 0,
                  inStableShavingsPrice: 0,
                  inFieldAlonePrice: 0,
                  inFieldHerdPrice: 0
                },
                stallionsAccepted: response.stallionsAccepted || false,
                stallionsPrice: response.stallionsPrice || 0,
                eventPricing: response.eventPricing || {
                  eventingCourse: false,
                  canterTrack: false,
                  jumpingTrack: false,
                  dressageTrack: false,
                  eventingCoursePrice: 0,
                  canterTrackPrice: 0,
                  jumpingTrackPrice: 0,
                  dressageTrackPrice: 0
                }
              };

              // Handle PriceRate - can be array or object
              if (Array.isArray(response.PriceRate) && response.PriceRate.length > 0) {
                normalizedData.priceRates = response.PriceRate
                  .filter((pr) => typeof pr?.PriceRate === "number" && pr.PriceRate > 0 && pr.RateType)
                  .map((pr) => ({
                    price: pr.PriceRate,
                    rateType: pr.RateType,
                  }));
              } else if (typeof response.PriceRate === "object" && response.PriceRate !== null) {
                if (typeof response.PriceRate.PriceRate === "number" && response.PriceRate.PriceRate > 0 && response.PriceRate.RateType) {
                  normalizedData.priceRates = [{
                    price: response.PriceRate.PriceRate,
                    rateType: response.PriceRate.RateType,
                  }];
                }
              }
              
              // Set price as first entry if available
              normalizedData.price = normalizedData.priceRates.length > 0 ? normalizedData.priceRates[0].price : 0;

              setSelectedStable(normalizedData);
              // Fetch booking availability for this stable
              fetchBookingAvailability(stableId);
            } else {
              notification.error({
                message: 'Stable Not Found',
                description: 'The requested stable could not be found',
                placement: 'topRight',
              });
            }
          } catch (error) {
            console.error('Error fetching stable data:', error);
            notification.error({
              message: 'Error Loading Stable',
              description: 'Failed to load stable information',
              placement: 'topRight',
            });
          } finally {
            setLoading(false);
          }
        }
      }
    };

    fetchStableData();
  }, [searchParams, notification]);

  // Handle booking type selection
  const handleBookingTypeChange = (type) => {
    setBookingType(type);
    setSelectedDateRange(null);
  };

  // Handle date range selection
  const handleDateRangeChange = (dates) => {
    setSelectedDateRange(dates);
    // Fetch availability for the selected date range (with 15 days buffer)
    if (dates && dates.length === 2 && selectedStable?.stableId) {
      fetchBookingAvailability(selectedStable.stableId, dates);
    }
  };

  // Handle service selection
  const handleServiceChange = (serviceType, serviceName, checked) => {
    setSelectedServices(prev => {
      const newServices = { ...prev };
      
      // Handle service selection - no mutual exclusivity
      if (serviceType === 'shortTermStay' && serviceName === 'selected') {
        // Handle short-term stay dropdown selection
        newServices.shortTermStay = {
          selected: checked
        };
      } else if (serviceType === 'longTermStay' && serviceName === 'selected') {
        // Handle long-term stay dropdown selection
        newServices.longTermStay = {
          selected: checked
        };
      } else if (serviceType === 'stallionsAccepted') {
        // Handle stallions as a simple boolean
        newServices.stallionsAccepted = checked;
      } else {
        // Update the specific service (for eventPricing)
        newServices[serviceType] = {
          ...newServices[serviceType],
          [serviceName]: checked
        };
      }
      
      return newServices;
    });
  };

  // Calculate number of days in booking
  const getNumberOfDays = () => {
    if (!selectedDateRange || selectedDateRange.length !== 2) return 0;
    return selectedDateRange[1].diff(selectedDateRange[0], 'day') + 1;
  };

  // Calculate additional service costs
  const getAdditionalServiceCosts = () => {
    if (!selectedStable || !selectedDateRange) return 0;
    
    const numberOfDays = getNumberOfDays();
    let totalAdditionalCost = 0;

    // Short-term stay costs (per day)
    if (selectedServices.shortTermStay.selected) {
      const selectedOption = selectedServices.shortTermStay.selected;
      if (selectedOption === 'inStableStraw' && selectedStable.shortTermStay.inStableStraw) {
        totalAdditionalCost += (selectedStable.shortTermStay.inStableStrawPrice || 0) * numberOfDays;
      } else if (selectedOption === 'inStableShavings' && selectedStable.shortTermStay.inStableShavings) {
        totalAdditionalCost += (selectedStable.shortTermStay.inStableShavingsPrice || 0) * numberOfDays;
      } else if (selectedOption === 'inFieldAlone' && selectedStable.shortTermStay.inFieldAlone) {
        totalAdditionalCost += (selectedStable.shortTermStay.inFieldAlonePrice || 0) * numberOfDays;
      } else if (selectedOption === 'inFieldHerd' && selectedStable.shortTermStay.inFieldHerd) {
        totalAdditionalCost += (selectedStable.shortTermStay.inFieldHerdPrice || 0) * numberOfDays;
      }
    }

    // Long-term stay costs (per day)
    if (selectedServices.longTermStay.selected) {
      const selectedOption = selectedServices.longTermStay.selected;
      if (selectedOption === 'inStableStraw' && selectedStable.longTermStay.inStableStraw) {
        totalAdditionalCost += (selectedStable.longTermStay.inStableStrawPrice || 0) * numberOfDays;
      } else if (selectedOption === 'inStableShavings' && selectedStable.longTermStay.inStableShavings) {
        totalAdditionalCost += (selectedStable.longTermStay.inStableShavingsPrice || 0) * numberOfDays;
      } else if (selectedOption === 'inFieldAlone' && selectedStable.longTermStay.inFieldAlone) {
        totalAdditionalCost += (selectedStable.longTermStay.inFieldAlonePrice || 0) * numberOfDays;
      } else if (selectedOption === 'inFieldHerd' && selectedStable.longTermStay.inFieldHerd) {
        totalAdditionalCost += (selectedStable.longTermStay.inFieldHerdPrice || 0) * numberOfDays;
      }
    }

    // Stallions cost (per day)
    if (selectedServices.stallionsAccepted && selectedStable.stallionsAccepted) {
      totalAdditionalCost += (selectedStable.stallionsPrice || 0) * numberOfDays;
    }

    // Event pricing costs (per day)
    if (selectedServices.eventPricing.eventingCourse && selectedStable.eventPricing.eventingCourse) {
      totalAdditionalCost += (selectedStable.eventPricing.eventingCoursePrice || 0) * numberOfDays;
    }
    if (selectedServices.eventPricing.canterTrack && selectedStable.eventPricing.canterTrack) {
      totalAdditionalCost += (selectedStable.eventPricing.canterTrackPrice || 0) * numberOfDays;
    }
    if (selectedServices.eventPricing.jumpingTrack && selectedStable.eventPricing.jumpingTrack) {
      totalAdditionalCost += (selectedStable.eventPricing.jumpingTrackPrice || 0) * numberOfDays;
    }
    if (selectedServices.eventPricing.dressageTrack && selectedStable.eventPricing.dressageTrack) {
      totalAdditionalCost += (selectedStable.eventPricing.dressageTrackPrice || 0) * numberOfDays;
    }

    return totalAdditionalCost;
  };

  // Fetch booking availability for the selected stable
  const fetchBookingAvailability = async (stableId, userDateRange = null) => {
    if (!stableId) return;
    
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    
    try {
      let startDate, endDate;
      
      if (userDateRange && userDateRange.length === 2) {
        // Use user's selected date range and extend it by 15 days before and after
        const userStart = dayjs(userDateRange[0]);
        const userEnd = dayjs(userDateRange[1]);
        
        startDate = userStart.subtract(15, 'days').format('YYYY-MM-DD');
        endDate = userEnd.add(15, 'days').format('YYYY-MM-DD');
      } else {
        // Fallback: Get bookings for the next 3 months to show availability
        startDate = dayjs().format('YYYY-MM-DD');
        endDate = dayjs().add(3, 'months').format('YYYY-MM-DD');
      }
      
      const response = await getRequest(
        `/api/bookingStables?stableId=${stableId}&startDate=${startDate}&endDate=${endDate}`
      );
      
      if (response.success && response.data) {
        setBookingAvailability(response.data);
      } else {
        setAvailabilityError('Failed to fetch booking availability');
      }
    } catch (error) {
      console.error('Error fetching booking availability:', error);
      setAvailabilityError('Error loading booking availability');
    } finally {
      setAvailabilityLoading(false);
    }
  };


  // Get base booking price based on booking type
  const getBaseBookingPrice = () => {
    if (!selectedStable || !bookingType) return 0;
    
    // Use stable's price rates if available
    if (selectedStable.priceRates && selectedStable.priceRates.length > 0) {
      // Find the rate type that matches the booking type
      const matchingRate = selectedStable.priceRates.find(pr => pr.rateType === bookingType);
      
      if (matchingRate) {
        return matchingRate.price;
      }
      
      // Fallback to first available rate
      return selectedStable.priceRates[0].price;
    }
    
    // Fallback to stable's base price
    return selectedStable.price || 0;
  };

  // Get total booking price including additional services
  const getTotalBookingPrice = () => {
    const basePrice = getBaseBookingPrice();
    const additionalCosts = getAdditionalServiceCosts();
    return basePrice + additionalCosts;
  };

  // Calculate service price details
  const getServicePriceDetails = () => {
    if (!selectedStable || !selectedDateRange) return {};
    
    const numberOfDays = getNumberOfDays();
    const priceDetails = {
      shortTermStay: {
        selected: selectedServices.shortTermStay.selected,
        price: 0,
        pricePerDay: 0
      },
      longTermStay: {
        selected: selectedServices.longTermStay.selected,
        price: 0,
        pricePerDay: 0
      },
      stallions: {
        selected: selectedServices.stallionsAccepted,
        price: 0,
        pricePerDay: 0
      },
      eventPricing: {
        eventingCourse: selectedServices.eventPricing.eventingCourse,
        eventingCoursePrice: 0,
        canterTrack: selectedServices.eventPricing.canterTrack,
        canterTrackPrice: 0,
        jumpingTrack: selectedServices.eventPricing.jumpingTrack,
        jumpingTrackPrice: 0,
        dressageTrack: selectedServices.eventPricing.dressageTrack,
        dressageTrackPrice: 0
      }
    };

    // Calculate short-term stay prices
    if (selectedServices.shortTermStay.selected) {
      const selectedOption = selectedServices.shortTermStay.selected;
      let pricePerDay = 0;
      if (selectedOption === 'inStableStraw' && selectedStable.shortTermStay.inStableStraw) {
        pricePerDay = selectedStable.shortTermStay.inStableStrawPrice || 0;
      } else if (selectedOption === 'inStableShavings' && selectedStable.shortTermStay.inStableShavings) {
        pricePerDay = selectedStable.shortTermStay.inStableShavingsPrice || 0;
      } else if (selectedOption === 'inFieldAlone' && selectedStable.shortTermStay.inFieldAlone) {
        pricePerDay = selectedStable.shortTermStay.inFieldAlonePrice || 0;
      } else if (selectedOption === 'inFieldHerd' && selectedStable.shortTermStay.inFieldHerd) {
        pricePerDay = selectedStable.shortTermStay.inFieldHerdPrice || 0;
      }
      priceDetails.shortTermStay.pricePerDay = pricePerDay;
      priceDetails.shortTermStay.price = pricePerDay * numberOfDays;
    }

    // Calculate long-term stay prices
    if (selectedServices.longTermStay.selected) {
      const selectedOption = selectedServices.longTermStay.selected;
      let pricePerDay = 0;
      if (selectedOption === 'inStableStraw' && selectedStable.longTermStay.inStableStraw) {
        pricePerDay = selectedStable.longTermStay.inStableStrawPrice || 0;
      } else if (selectedOption === 'inStableShavings' && selectedStable.longTermStay.inStableShavings) {
        pricePerDay = selectedStable.longTermStay.inStableShavingsPrice || 0;
      } else if (selectedOption === 'inFieldAlone' && selectedStable.longTermStay.inFieldAlone) {
        pricePerDay = selectedStable.longTermStay.inFieldAlonePrice || 0;
      } else if (selectedOption === 'inFieldHerd' && selectedStable.longTermStay.inFieldHerd) {
        pricePerDay = selectedStable.longTermStay.inFieldHerdPrice || 0;
      }
      priceDetails.longTermStay.pricePerDay = pricePerDay;
      priceDetails.longTermStay.price = pricePerDay * numberOfDays;
    }

    // Calculate stallions prices
    if (selectedServices.stallionsAccepted && selectedStable.stallionsAccepted) {
      const pricePerDay = selectedStable.stallionsPrice || 0;
      priceDetails.stallions.pricePerDay = pricePerDay;
      priceDetails.stallions.price = pricePerDay * numberOfDays;
    }

    // Calculate event pricing
    if (selectedServices.eventPricing.eventingCourse && selectedStable.eventPricing.eventingCourse) {
      const pricePerDay = selectedStable.eventPricing.eventingCoursePrice || 0;
      priceDetails.eventPricing.eventingCoursePrice = pricePerDay * numberOfDays;
    }
    if (selectedServices.eventPricing.canterTrack && selectedStable.eventPricing.canterTrack) {
      const pricePerDay = selectedStable.eventPricing.canterTrackPrice || 0;
      priceDetails.eventPricing.canterTrackPrice = pricePerDay * numberOfDays;
    }
    if (selectedServices.eventPricing.jumpingTrack && selectedStable.eventPricing.jumpingTrack) {
      const pricePerDay = selectedStable.eventPricing.jumpingTrackPrice || 0;
      priceDetails.eventPricing.jumpingTrackPrice = pricePerDay * numberOfDays;
    }
    if (selectedServices.eventPricing.dressageTrack && selectedStable.eventPricing.dressageTrack) {
      const pricePerDay = selectedStable.eventPricing.dressageTrackPrice || 0;
      priceDetails.eventPricing.dressageTrackPrice = pricePerDay * numberOfDays;
    }

    return priceDetails;
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    // Validate required fields
    if (!bookingType || !selectedDateRange) {
      notification.error({
        message: 'Validation Error',
        description: 'Please select booking type and date range',
        placement: 'topRight',
      });
      return;
    }

    // Check user authentication
    const userData = getUserData();
    if (!userData.id) {
      notification.error({
        message: 'Authentication Required',
        description: 'Please login to make a booking',
        placement: 'topRight',
      });
      return;
    }

    setLoading(true);
    try {
      const servicePriceDetails = getServicePriceDetails();
      
      // Fix the additionalServices structure to match schema
      const fixedAdditionalServices = {
        shortTermStay: selectedServices.shortTermStay,
        longTermStay: selectedServices.longTermStay,
        stallionsAccepted: selectedServices.stallionsAccepted, // Simple boolean, not nested
        eventPricing: selectedServices.eventPricing
      };

      const bookingData = {
        clientId: userData.id,
        userId: selectedStable?.userId?._id || selectedStable?.userId,
        stableId: selectedStable?.stableId,
        bookingType: bookingType,
        startDate: selectedDateRange[0].format('YYYY-MM-DD'),
        endDate: selectedDateRange[1].format('YYYY-MM-DD'),
        numberOfHorses: values.horseCount,
        basePrice: getBaseBookingPrice(),
        additionalServices: fixedAdditionalServices,
        servicePriceDetails: servicePriceDetails,
        additionalServiceCosts: getAdditionalServiceCosts(),
        totalPrice: getTotalBookingPrice(),
        numberOfDays: getNumberOfDays()
      };
      
      console.log('Sending booking data:', bookingData);
      console.log('Selected services:', selectedServices);
      console.log('Fixed additional services:', fixedAdditionalServices);
      
      const result = await postRequest('/api/bookingStables', bookingData);

      if (result.success) {
        notification.success({
          message: 'Booking Successful',
          description: 'Booking created successfully!',
          placement: 'topRight',
        });
        form.resetFields();
        setBookingType(null);
        setSelectedDateRange(null);
        setSelectedServices({
          shortTermStay: {
            selected: null
          },
          longTermStay: {
            selected: null
          },
          stallionsAccepted: false,
          eventPricing: {
            eventingCourse: false,
            canterTrack: false,
            jumpingTrack: false,
            dressageTrack: false
          }
        });
        // Refresh availability data to show the new booking
        if (selectedStable?.stableId) {
          fetchBookingAvailability(selectedStable.stableId, selectedDateRange);
        }
      } else {
        notification.error({
          message: 'Booking Failed',
          description: result.message || 'Failed to create booking',
          placement: 'topRight',
        });
      }
    } catch (error) {
      console.error('Booking error:', error);
      notification.error({
        message: 'Request Failed',
        description: 'Failed to submit booking request',
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans">
      <TopSection title="Booking Stables" />
      
      <section className="mx-auto max-w-6xl px-4 py-10">
        {/* Top Section: Selected Stable and Booking Availability - 50% each */}
        <Row gutter={[24, 24]} className="mb-6">
          {/* Selected Stable Information - 50% width */}
          <Col xs={24} lg={12}>
            {selectedStable && (
              <Card title="Selected Stable" className="h-full">
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    {selectedStable.images && selectedStable.images.length > 0 && (
                      <img 
                        src={selectedStable.images[0]} 
                        alt={selectedStable.title}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )}
                  </Col>
                  <Col xs={24} md={16}>
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold text-brand">{selectedStable.title}</h3>
                      {selectedStable.details && (
                        <p className="text-gray-600">{selectedStable.details}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {selectedStable.priceRates && selectedStable.priceRates.length > 0 ? (
                          selectedStable.priceRates.map((pr, idx) => (
                            <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-brand/10 text-brand border border-brand/20">
                              ${pr.price}{pr.rateType ? `/${pr.rateType}` : ''}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-brand/10 text-brand border border-brand/20">
                            ${selectedStable.price}
                          </span>
                        )}
                      </div>
                      {selectedStable.ownerName && (
                        <p className="text-sm text-gray-500">
                          Owner: {selectedStable.ownerName}
                          {selectedStable.ownerEmail && ` (${selectedStable.ownerEmail})`}
                        </p>
                      )}
                      {selectedStable.slots && selectedStable.slots.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Available Slots:</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedStable.slots.map((slot, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                                {slot.date} {slot.startTime}-{slot.endTime}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>
              </Card>
            )}
          </Col>

          {/* Booking Availability Panel - 50% width */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                selectedDateRange && selectedDateRange.length === 2 
                  ? `Booking Availability (${dayjs(selectedDateRange[0]).subtract(15, 'days').format('MMM DD')} - ${dayjs(selectedDateRange[1]).add(15, 'days').format('MMM DD, YYYY')})`
                  : "Booking Availability"
              }
              className="h-full"
              extra={
                selectedStable && (
                  <Button 
                    size="small" 
                    onClick={() => fetchBookingAvailability(selectedStable.stableId, selectedDateRange)}
                    loading={availabilityLoading}
                  >
                    Refresh
                  </Button>
                )
              }
            >
              {availabilityLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Spin size="large" />
                </div>
              ) : availabilityError ? (
                <Alert
                  message="Error Loading Availability"
                  description={availabilityError}
                  type="error"
                  showIcon
                />
              ) : bookingAvailability.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No bookings found for the next 3 months</p>
                  <p className="text-sm text-gray-400 mt-2">This stable appears to be available!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800">Booked Dates</h4>
                    <span className="text-sm text-gray-500">
                      {bookingAvailability.length} booking{bookingAvailability.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {bookingAvailability.map((booking) => (
                      <Tag key={booking._id} color="red" className="text-xs">
                        {dayjs(booking.startDate).format('MMM DD, YYYY')} to {dayjs(booking.endDate).format('MMM DD, YYYY')}
                      </Tag>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> These dates are already booked and not available for new bookings.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Bottom Section: Booking Information - 100% width */}
        <Row gutter={[24, 24]}>
          <Col xs={24}>
            <Card title="Booking Information">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              requiredMark={false}
            >
              {/* Basic Booking Information - 3 columns */}
              <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Select Booking Type"
                    name="bookingType"
                    rules={[{ required: true, message: 'Please select booking type' }]}
                  >
                    <Select
                      size="large"
                      placeholder="Choose booking type"
                      onChange={handleBookingTypeChange}
                      value={bookingType}
                    >
                      <Option value="day">Day</Option>
                      <Option value="week">Week</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label="Number of Horses"
                    name="horseCount"
                    rules={[{ required: true, message: 'Please enter number of horses' }]}
                  >
                    <Select
                      size="large"
                      placeholder="Select number of horses"
                    >
                      <Option value={1}>1 Horse</Option>
                      <Option value={2}>2 Horses</Option>
                      <Option value={3}>3 Horses</Option>
                      <Option value={4}>4+ Horses</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  {bookingType && (
                    <Form.Item
                      label="Select Date Range"
                      name="dateRange"
                      rules={[{ required: true, message: 'Please select a date range' }]}
                    >
                      <RangePicker
                        style={{ width: '100%' }}
                        size="large"
                        onChange={handleDateRangeChange}
                        disabledDate={(current) => current && current < dayjs().startOf('day')}
                        placeholder={['Start Date', 'End Date']}
                      />
                    </Form.Item>
                  )}
                </Col>
              </Row>

              {/* Additional Services Section */}
              {selectedStable && (
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Additional Services</h4>
                  
                  <Row gutter={[16, 16]}>
                    {/* Short-term Stay Services */}
                    {(selectedStable.shortTermStay && Object.values(selectedStable.shortTermStay).some(option => option)) && (
                      <Col xs={24} lg={12}>
                        <div className="border rounded-lg p-4 bg-blue-50 h-full">
                          <h5 className="font-semibold text-blue-800 mb-3">Short-term Stay (Per Day)</h5>
                          <div className="space-y-2">
                            <Select
                              size="large"
                              placeholder="Select short-term stay option"
                              value={selectedServices.shortTermStay.selected}
                              onChange={(value) => handleServiceChange('shortTermStay', 'selected', value)}
                              className="w-full"
                            >
                              {selectedStable.shortTermStay.inStableStraw && (
                                <Option value="inStableStraw">
                                  In Stable (on straw) - ${selectedStable.shortTermStay.inStableStrawPrice}/day
                                </Option>
                              )}
                              {selectedStable.shortTermStay.inStableShavings && (
                                <Option value="inStableShavings">
                                  In Stable (on shavings) - ${selectedStable.shortTermStay.inStableShavingsPrice}/day
                                </Option>
                              )}
                              {selectedStable.shortTermStay.inFieldAlone && (
                                <Option value="inFieldAlone">
                                  In Field (alone) - ${selectedStable.shortTermStay.inFieldAlonePrice}/day
                                </Option>
                              )}
                              {selectedStable.shortTermStay.inFieldHerd && (
                                <Option value="inFieldHerd">
                                  In Field (herd) - ${selectedStable.shortTermStay.inFieldHerdPrice}/day
                                </Option>
                              )}
                            </Select>
                          </div>
                        </div>
                      </Col>
                    )}

                    {/* Long-term Stay Services */}
                    {(selectedStable.longTermStay && Object.values(selectedStable.longTermStay).some(option => option)) && (
                      <Col xs={24} lg={12}>
                        <div className="border rounded-lg p-4 bg-green-50 h-full">
                          <h5 className="font-semibold text-green-800 mb-3">Long-term Stay (Per Day)</h5>
                          <div className="space-y-2">
                            <Select
                              size="large"
                              placeholder="Select long-term stay option"
                              value={selectedServices.longTermStay.selected}
                              onChange={(value) => handleServiceChange('longTermStay', 'selected', value)}
                              className="w-full"
                            >
                              {selectedStable.longTermStay.inStableStraw && (
                                <Option value="inStableStraw">
                                  In Stable (on straw) - ${selectedStable.longTermStay.inStableStrawPrice}/day
                                </Option>
                              )}
                              {selectedStable.longTermStay.inStableShavings && (
                                <Option value="inStableShavings">
                                  In Stable (on shavings) - ${selectedStable.longTermStay.inStableShavingsPrice}/day
                                </Option>
                              )}
                              {selectedStable.longTermStay.inFieldAlone && (
                                <Option value="inFieldAlone">
                                  In Field (alone) - ${selectedStable.longTermStay.inFieldAlonePrice}/day
                                </Option>
                              )}
                              {selectedStable.longTermStay.inFieldHerd && (
                                <Option value="inFieldHerd">
                                  In Field (herd) - ${selectedStable.longTermStay.inFieldHerdPrice}/day
                                </Option>
                              )}
                            </Select>
                          </div>
                        </div>
                      </Col>
                    )}

                    {/* Stallions */}
                    {selectedStable.stallionsAccepted && (
                      <Col xs={24} lg={12}>
                        <div className="border rounded-lg p-4 bg-yellow-50 h-full">
                          <h5 className="font-semibold text-yellow-800 mb-3">Stallions</h5>
                          <div className="flex items-center justify-between">
                            <Checkbox
                              checked={selectedServices.stallionsAccepted}
                              onChange={(e) => handleServiceChange('stallionsAccepted', null, e.target.checked)}
                            >
                              <span className="text-sm">Stallions Accepted</span>
                            </Checkbox>
                            <span className="text-sm font-medium text-yellow-700">
                              ${selectedStable.stallionsPrice}/day
                            </span>
                          </div>
                        </div>
                      </Col>
                    )}

                    {/* Event Pricing */}
                    {(selectedStable.eventPricing && Object.values(selectedStable.eventPricing).some(option => option)) && (
                      <Col xs={24} lg={12}>
                        <div className="border rounded-lg p-4 bg-purple-50 h-full">
                          <h5 className="font-semibold text-purple-800 mb-3">Event Pricing (Per Day)</h5>
                          <div className="space-y-2">
                            {selectedStable.eventPricing.eventingCourse && (
                              <div className="flex items-center justify-between">
                                <Checkbox
                                  checked={selectedServices.eventPricing.eventingCourse}
                                  onChange={(e) => handleServiceChange('eventPricing', 'eventingCourse', e.target.checked)}
                                >
                                  <span className="text-sm">Eventing Course</span>
                                </Checkbox>
                                <span className="text-sm font-medium text-purple-700">
                                  ${selectedStable.eventPricing.eventingCoursePrice}/day
                                </span>
                              </div>
                            )}
                            {selectedStable.eventPricing.canterTrack && (
                              <div className="flex items-center justify-between">
                                <Checkbox
                                  checked={selectedServices.eventPricing.canterTrack}
                                  onChange={(e) => handleServiceChange('eventPricing', 'canterTrack', e.target.checked)}
                                >
                                  <span className="text-sm">Canter Track</span>
                                </Checkbox>
                                <span className="text-sm font-medium text-purple-700">
                                  ${selectedStable.eventPricing.canterTrackPrice}/day
                                </span>
                              </div>
                            )}
                            {selectedStable.eventPricing.jumpingTrack && (
                              <div className="flex items-center justify-between">
                                <Checkbox
                                  checked={selectedServices.eventPricing.jumpingTrack}
                                  onChange={(e) => handleServiceChange('eventPricing', 'jumpingTrack', e.target.checked)}
                                >
                                  <span className="text-sm">Jumping Track</span>
                                </Checkbox>
                                <span className="text-sm font-medium text-purple-700">
                                  ${selectedStable.eventPricing.jumpingTrackPrice}/day
                                </span>
                              </div>
                            )}
                            {selectedStable.eventPricing.dressageTrack && (
                              <div className="flex items-center justify-between">
                                <Checkbox
                                  checked={selectedServices.eventPricing.dressageTrack}
                                  onChange={(e) => handleServiceChange('eventPricing', 'dressageTrack', e.target.checked)}
                                >
                                  <span className="text-sm">Dressage Track</span>
                                </Checkbox>
                                <span className="text-sm font-medium text-purple-700">
                                  ${selectedStable.eventPricing.dressageTrackPrice}/day
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Col>
                    )}
                  </Row>
                </div>
              )}

              {/* Price Display */}
              {bookingType && selectedDateRange && (
                <div className="mb-4 p-4 bg-brand/5 rounded-lg border border-brand/20 mt-3">
                  <h4 className="font-semibold text-gray-800 mb-2">Booking Summary:</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Booking Type:</span>
                      <span className="font-medium capitalize">{bookingType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date Range:</span>
                      <span className="font-medium">
                        {selectedDateRange[0].format('MMM DD')} - {selectedDateRange[1].format('MMM DD, YYYY')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Number of Days:</span>
                      <span className="font-medium">{getNumberOfDays()} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Price per {bookingType}:</span>
                      <span className="font-bold text-brand">${getBaseBookingPrice()}</span>
                    </div>
                    
                    {/* Additional Services Breakdown */}
                    {getAdditionalServiceCosts() > 0 && (
                      <div className="pt-2 border-t border-gray-200">
                        <div className="text-sm text-gray-600 mb-2">Additional Services:</div>
                        {selectedServices.shortTermStay.selected && (
                          <div className="flex justify-between text-sm">
                            <span>
                              Short-term {selectedServices.shortTermStay.selected === 'inStableStraw' ? 'Stable (straw)' :
                                        selectedServices.shortTermStay.selected === 'inStableShavings' ? 'Stable (shavings)' :
                                        selectedServices.shortTermStay.selected === 'inFieldAlone' ? 'Field (alone)' :
                                        'Field (herd)'} × {getNumberOfDays()} days:
                            </span>
                            <span>
                              ${selectedServices.shortTermStay.selected === 'inStableStraw' ? (selectedStable.shortTermStay.inStableStrawPrice || 0) * getNumberOfDays() :
                                selectedServices.shortTermStay.selected === 'inStableShavings' ? (selectedStable.shortTermStay.inStableShavingsPrice || 0) * getNumberOfDays() :
                                selectedServices.shortTermStay.selected === 'inFieldAlone' ? (selectedStable.shortTermStay.inFieldAlonePrice || 0) * getNumberOfDays() :
                                (selectedStable.shortTermStay.inFieldHerdPrice || 0) * getNumberOfDays()}
                            </span>
                          </div>
                        )}
                        {selectedServices.longTermStay.selected && (
                          <div className="flex justify-between text-sm">
                            <span>
                              Long-term {selectedServices.longTermStay.selected === 'inStableStraw' ? 'Stable (straw)' :
                                        selectedServices.longTermStay.selected === 'inStableShavings' ? 'Stable (shavings)' :
                                        selectedServices.longTermStay.selected === 'inFieldAlone' ? 'Field (alone)' :
                                        'Field (herd)'} × {getNumberOfDays()} days:
                            </span>
                            <span>
                              ${selectedServices.longTermStay.selected === 'inStableStraw' ? (selectedStable.longTermStay.inStableStrawPrice || 0) * getNumberOfDays() :
                                selectedServices.longTermStay.selected === 'inStableShavings' ? (selectedStable.longTermStay.inStableShavingsPrice || 0) * getNumberOfDays() :
                                selectedServices.longTermStay.selected === 'inFieldAlone' ? (selectedStable.longTermStay.inFieldAlonePrice || 0) * getNumberOfDays() :
                                (selectedStable.longTermStay.inFieldHerdPrice || 0) * getNumberOfDays()}
                            </span>
                          </div>
                        )}
                        {selectedServices.stallionsAccepted && selectedStable.stallionsAccepted && (
                          <div className="flex justify-between text-sm">
                            <span>Stallions × {getNumberOfDays()} days:</span>
                            <span>${(selectedStable.stallionsPrice || 0) * getNumberOfDays()}</span>
                          </div>
                        )}
                        {selectedServices.eventPricing.eventingCourse && selectedStable.eventPricing.eventingCourse && (
                          <div className="flex justify-between text-sm">
                            <span>Eventing Course × {getNumberOfDays()} days:</span>
                            <span>${(selectedStable.eventPricing.eventingCoursePrice || 0) * getNumberOfDays()}</span>
                          </div>
                        )}
                        {selectedServices.eventPricing.canterTrack && selectedStable.eventPricing.canterTrack && (
                          <div className="flex justify-between text-sm">
                            <span>Canter Track × {getNumberOfDays()} days:</span>
                            <span>${(selectedStable.eventPricing.canterTrackPrice || 0) * getNumberOfDays()}</span>
                          </div>
                        )}
                        {selectedServices.eventPricing.jumpingTrack && selectedStable.eventPricing.jumpingTrack && (
                          <div className="flex justify-between text-sm">
                            <span>Jumping Track × {getNumberOfDays()} days:</span>
                            <span>${(selectedStable.eventPricing.jumpingTrackPrice || 0) * getNumberOfDays()}</span>
                          </div>
                        )}
                        {selectedServices.eventPricing.dressageTrack && selectedStable.eventPricing.dressageTrack && (
                          <div className="flex justify-between text-sm">
                            <span>Dressage Track × {getNumberOfDays()} days:</span>
                            <span>${(selectedStable.eventPricing.dressageTrackPrice || 0) * getNumberOfDays()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-medium pt-1 border-t border-gray-200">
                          <span>Additional Services Total:</span>
                          <span>${getAdditionalServiceCosts()}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800">Total Price:</span>
                        <span className="text-xl font-bold text-brand">${getTotalBookingPrice()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  className="w-full"
                  disabled={!bookingType || !selectedDateRange}
                >
                  Book Stable (${getTotalBookingPrice()})
                </Button>
              </Form.Item>
            </Form>
            </Card>
          </Col>
        </Row>
      </section>
    </div>
  );
}

// Main export function with Suspense boundary
export default function BookingStablesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <BookingStablesContent />
    </Suspense>
  );
}