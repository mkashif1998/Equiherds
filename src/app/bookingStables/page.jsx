"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DatePicker, Form, Button, Card, Row, Col, TimePicker, Select, App } from "antd";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import TopSection from "../components/topSection";
import { postRequest } from "@/service";
import { getUserData } from "../utils/localStorage";

// Extend dayjs with required plugins
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const { RangePicker } = DatePicker;
const { Option } = Select;

// Separate component for handling search params
function BookingStablesContent() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedStable, setSelectedStable] = useState(null);
  const [bookingType, setBookingType] = useState(null); // 'day' or 'week'
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const searchParams = useSearchParams();
  const { notification } = App.useApp();

  // Read URL parameters and set selected stable data
  useEffect(() => {
    if (searchParams) {
      try {
        const stableData = {
          stableId: searchParams.get('stableId'),
          title: searchParams.get('title'),
          price: searchParams.get('price'),
          priceRates: null,
          images: null,
          details: searchParams.get('details'),
          slots: null,
          ownerName: searchParams.get('ownerName'),
          ownerEmail: searchParams.get('ownerEmail')
        };

        // Safely parse JSON parameters
        const priceRatesParam = searchParams.get('priceRates');
        if (priceRatesParam && priceRatesParam !== 'null') {
          try {
            stableData.priceRates = JSON.parse(priceRatesParam);
          } catch (e) {
            console.warn('Failed to parse priceRates:', e);
            stableData.priceRates = [];
          }
        }

        const imagesParam = searchParams.get('images');
        if (imagesParam && imagesParam !== 'null') {
          try {
            stableData.images = JSON.parse(imagesParam);
          } catch (e) {
            console.warn('Failed to parse images:', e);
            stableData.images = [];
          }
        }

        const slotsParam = searchParams.get('slots');
        if (slotsParam && slotsParam !== 'null') {
          try {
            stableData.slots = JSON.parse(slotsParam);
          } catch (e) {
            console.warn('Failed to parse slots:', e);
            stableData.slots = [];
          }
        }
        
        // Only set if we have at least a stableId
        if (stableData.stableId) {
          setSelectedStable(stableData);
        }
      } catch (error) {
        console.error('Error parsing URL parameters:', error);
      }
    }
  }, [searchParams, form]);

  // Handle booking type selection
  const handleBookingTypeChange = (type) => {
    setBookingType(type);
    setSelectedDateRange(null);
  };

  // Handle date range selection
  const handleDateRangeChange = (dates) => {
    setSelectedDateRange(dates);
  };


  // Get booking price based on booking type
  const getBookingPrice = () => {
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
        userId: userData.id ,
        stableId: selectedStable?.stableId,
        bookingType: bookingType,
        startDate: selectedDateRange[0].format('YYYY-MM-DD'),
        endDate: selectedDateRange[1].format('YYYY-MM-DD'),
        numberOfHorses: values.horseCount,
        price: getBookingPrice(),
        totalPrice: getBookingPrice()
      };
      
      console.log('Sending booking data:', bookingData);
      
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
        {/* Selected Stable Information */}
        {selectedStable && (
          <Card className="mb-6" title="Selected Stable">
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
                    Book Stable (${getBookingPrice()})
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


