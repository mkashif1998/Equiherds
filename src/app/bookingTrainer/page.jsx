"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DatePicker, Form, Button, Card, Row, Col, TimePicker, Select, App, Tag, Spin, Alert } from "antd";
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
function BookingTrainerContent() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [bookingType, setBookingType] = useState(null); // 'day' or 'week'
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const [bookingAvailability, setBookingAvailability] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);
  const searchParams = useSearchParams();
  const { notification } = App.useApp();

  // Fetch trainer data and set selected trainer
  useEffect(() => {
    const fetchTrainerData = async () => {
      if (searchParams) {
        const trainerId = searchParams.get('trainerId');
        if (trainerId) {
          try {
            setLoading(true);
            const response = await getRequest(`/api/trainer/${trainerId}`);
            
            if (response && response._id) {
              // Normalize the API response data
              const normalizedData = {
                trainerId: response._id,
                title: response.title || response.Tittle || "Untitled Trainer",
                details: response.details || response.Deatils || "",
                rating: response.Rating || response.rating || 0,
                images: Array.isArray(response.images) && response.images.length > 0 
                  ? response.images 
                  : Array.isArray(response.image) && response.image.length > 0 
                  ? response.image 
                  : ["/product/2.jpg"],
                experience: response.Experience || response.experience || "",
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
                price: 0
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

              setSelectedTrainer(normalizedData);
              // Fetch booking availability for this trainer
              fetchBookingAvailability(trainerId);
            } else {
              notification.error({
                message: 'Trainer Not Found',
                description: 'The requested trainer could not be found',
                placement: 'topRight',
              });
            }
          } catch (error) {
            console.error('Error fetching trainer data:', error);
            notification.error({
              message: 'Error Loading Trainer',
              description: 'Failed to load trainer information',
              placement: 'topRight',
            });
          } finally {
            setLoading(false);
          }
        }
      }
    };

    fetchTrainerData();
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
    if (dates && dates.length === 2 && selectedTrainer?.trainerId) {
      fetchBookingAvailability(selectedTrainer.trainerId, dates);
    }
  };

  // Fetch booking availability for the selected trainer
  const fetchBookingAvailability = async (trainerId, userDateRange = null) => {
    if (!trainerId) return;
    
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
        `/api/bookingTrainer?trainerId=${trainerId}&startDate=${startDate}&endDate=${endDate}`
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


  // Get booking price based on booking type
  const getBookingPrice = () => {
    if (!selectedTrainer || !bookingType) return 0;
    
    // Use trainer's price rates if available
    if (selectedTrainer.priceRates && selectedTrainer.priceRates.length > 0) {
      // Find the rate type that matches the booking type
      const matchingRate = selectedTrainer.priceRates.find(pr => pr.rateType === bookingType);
      
      if (matchingRate) {
        return matchingRate.price;
      }
      
      // Fallback to first available rate
      return selectedTrainer.priceRates[0].price;
    }
    
    // Fallback to trainer's base price
    return selectedTrainer.price || 0;
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
      const bookingData = {
        clientId: userData.id,
        userId: selectedTrainer?.userId?._id || selectedTrainer?.userId,
        trainerId: selectedTrainer?.trainerId,
        bookingType: bookingType,
        startDate: selectedDateRange[0].format('YYYY-MM-DD'),
        endDate: selectedDateRange[1].format('YYYY-MM-DD'),
        price: getBookingPrice(),
        totalPrice: getBookingPrice()
      };
      
      console.log('Sending booking data:', bookingData);
      
      const result = await postRequest('/api/bookingTrainer', bookingData);

      if (result.success) {
        notification.success({
          message: 'Booking Successful',
          description: 'Booking created successfully!',
          placement: 'topRight',
        });
        form.resetFields();
        setBookingType(null);
        setSelectedDateRange(null);
        // Refresh availability data to show the new booking
        if (selectedTrainer?.trainerId) {
          fetchBookingAvailability(selectedTrainer.trainerId, selectedDateRange);
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
      <TopSection title="Booking Trainer" />
      
      <section className="mx-auto max-w-6xl px-4 py-10">
      {/* Selected Trainer Information */}
      {selectedTrainer && (
        <Card className="mb-6" title="Selected Trainer">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              {selectedTrainer.images && selectedTrainer.images.length > 0 && (
                <img 
                  src={selectedTrainer.images[0]} 
                  alt={selectedTrainer.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
            </Col>
            <Col xs={24} md={16}>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-brand">{selectedTrainer.title}</h3>
                {selectedTrainer.details && (
                  <p className="text-gray-600">{selectedTrainer.details}</p>
                )}
                {selectedTrainer.experience && (
                  <p className="text-sm text-gray-500">
                    <strong>Experience:</strong> {selectedTrainer.experience}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {selectedTrainer.priceRates && selectedTrainer.priceRates.length > 0 ? (
                    selectedTrainer.priceRates.map((pr, idx) => (
                      <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-brand/10 text-brand border border-brand/20">
                        ${pr.price}{pr.rateType ? `/${pr.rateType}` : ''}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-brand/10 text-brand border border-brand/20">
                      ${selectedTrainer.price}
                    </span>
                  )}
                </div>
                {selectedTrainer.ownerName && (
                  <p className="text-sm text-gray-500">
                    Trainer: {selectedTrainer.ownerName}
                    {selectedTrainer.ownerEmail && ` (${selectedTrainer.ownerEmail})`}
                  </p>
                )}
                {selectedTrainer.slots && selectedTrainer.slots.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Available Slots:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTrainer.slots.map((slot, idx) => (
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

        <Row gutter={[24, 24]}>
          {/* Booking Form */}
          <Col xs={24} lg={12}>
            <Card title="Booking Information" className="h-fit">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                requiredMark={false}
              >
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

                <Form.Item
                  label="Training Session Type"
                  name="sessionType"
                  rules={[{ required: true, message: 'Please select training session type' }]}
                >
                  <Select
                    size="large"
                    placeholder="Select training session type"
                  >
                    <Option value="basic">Basic Training</Option>
                    <Option value="advanced">Advanced Training</Option>
                    <Option value="jumping">Jumping Training</Option>
                    <Option value="dressage">Dressage Training</Option>
                  </Select>
                </Form.Item>

                {/* Price Display */}
                {bookingType && selectedDateRange && (
                  <div className="mb-4 p-4 bg-brand/5 rounded-lg border border-brand/20">
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
                        <span className="text-gray-600">Price per {bookingType}:</span>
                        <span className="font-bold text-brand">${getBookingPrice()}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800">Total Price:</span>
                          <span className="text-xl font-bold text-brand">${getBookingPrice()}</span>
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
                    Book Training Session (${getBookingPrice()})
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          {/* Booking Availability Panel */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                selectedDateRange && selectedDateRange.length === 2 
                  ? `Booking Availability (${dayjs(selectedDateRange[0]).subtract(15, 'days').format('MMM DD')} - ${dayjs(selectedDateRange[1]).add(15, 'days').format('MMM DD, YYYY')})`
                  : "Booking Availability"
              }
              className="h-fit"
            extra={
              selectedTrainer && (
                <Button 
                  size="small" 
                  onClick={() => fetchBookingAvailability(selectedTrainer.trainerId, selectedDateRange)}
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
                  <p className="text-sm text-gray-400 mt-2">This trainer appears to be available!</p>
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
        </section>
      </div>
  );
}

// Main export function with Suspense boundary
export default function BookingTrainerPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <BookingTrainerContent />
    </Suspense>
  );
}