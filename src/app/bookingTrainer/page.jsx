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
  const [bookingType, setBookingType] = useState(null); // 'week' or 'month'
  const [selectedDateRange, setSelectedDateRange] = useState(null);
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
              // Use the API response data directly
              setSelectedTrainer(response);
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
  };



  // Calculate hours per week from schedule
  const getHoursPerWeek = () => {
    if (!selectedTrainer || !selectedTrainer.schedule || !Array.isArray(selectedTrainer.schedule)) {
      return 0;
    }
    
    let totalHours = 0;
    selectedTrainer.schedule.forEach(slot => {
      const startTime = dayjs(slot.startTime, 'HH:mm');
      const endTime = dayjs(slot.endTime, 'HH:mm');
      const hours = endTime.diff(startTime, 'hour', true);
      totalHours += hours;
    });
    
    return totalHours;
  };

  // Calculate total price based on booking type and duration
  const calculateTotalPrice = () => {
    if (!selectedTrainer || !bookingType || !selectedDateRange) return 0;
    
    const hourlyRate = selectedTrainer.price || 0;
    const hoursPerWeek = getHoursPerWeek();
    const startDate = dayjs(selectedDateRange[0]);
    const endDate = dayjs(selectedDateRange[1]);
    
    if (bookingType === 'week') {
      // Calculate number of weeks and multiply by actual hours per week
      const weeks = Math.ceil(endDate.diff(startDate, 'day') / 7);
      return hourlyRate * hoursPerWeek * weeks;
    } else if (bookingType === 'month') {
      // Calculate number of months and multiply by hours per month (hours per week * 4)
      const months = Math.ceil(endDate.diff(startDate, 'month', true));
      const hoursPerMonth = hoursPerWeek * 4; // Assuming 4 weeks per month
      return hourlyRate * hoursPerMonth * months;
    }
    
    return hourlyRate;
  };

  // Get price per unit (week or month)
  const getPricePerUnit = () => {
    if (!selectedTrainer) return 0;
    const hourlyRate = selectedTrainer.price || 0;
    const hoursPerWeek = getHoursPerWeek();
    
    if (bookingType === 'week') {
      return hourlyRate * hoursPerWeek; // Actual hours per week from schedule
    } else if (bookingType === 'month') {
      return hourlyRate * hoursPerWeek * 4; // Hours per month (hours per week * 4)
    }
    
    return hourlyRate;
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
        userId: selectedTrainer?.userId?._id || selectedTrainer?.userId,
        clientId: userData.id,
        trainerId: selectedTrainer?._id,
        bookingDate: dayjs().format('YYYY-MM-DD'),
        bookingType: bookingType,
        startDate: selectedDateRange[0].format('YYYY-MM-DD'),
        endDate: selectedDateRange[1].format('YYYY-MM-DD'),
        price: getPricePerUnit(),
        totalPrice: calculateTotalPrice()
      };
      
      console.log('Sending booking data:', bookingData);
      
      const result = await postRequest('/api/bookingTrainers', bookingData);

      if (result.success) {
        notification.success({
          message: 'Booking Successful',
          description: 'Booking created successfully!',
          placement: 'topRight',
        });
        form.resetFields();
        setBookingType(null);
        setSelectedDateRange(null);
        setSessionType(null);
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
                {selectedTrainer.Experience && (
                  <p className="text-sm text-gray-500">
                    <strong>Experience:</strong> {selectedTrainer.Experience} years
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-brand/10 text-brand border border-brand/20">
                    ${selectedTrainer.price}/hour
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-brand/10 text-brand border border-brand/20">
                    ${selectedTrainer.price * getHoursPerWeek()}/week ({getHoursPerWeek()} hours)
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-brand/10 text-brand border border-brand/20">
                    ${selectedTrainer.price * getHoursPerWeek() * 4}/month ({getHoursPerWeek() * 4} hours)
                  </span>
                </div>
                {selectedTrainer.userId && (
                  <p className="text-sm text-gray-500">
                    Trainer: {selectedTrainer.userId.firstName} {selectedTrainer.userId.lastName}
                    {selectedTrainer.userId.email && ` (${selectedTrainer.userId.email})`}
                  </p>
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
                    <Option value="week">Week</Option>
                    <Option value="month">Month</Option>
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
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">
                          {bookingType === 'week'
                            ? `${Math.ceil(dayjs(selectedDateRange[1]).diff(dayjs(selectedDateRange[0]), 'day') / 7)} weeks`
                            : `${Math.ceil(dayjs(selectedDateRange[1]).diff(dayjs(selectedDateRange[0]), 'month', true))} months`
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price per {bookingType}:</span>
                        <span className="font-bold text-brand">${getPricePerUnit()}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800">Total Price:</span>
                          <span className="text-xl font-bold text-brand">${calculateTotalPrice()}</span>
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
                    Book Training Session (${calculateTotalPrice()})
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          {/* Trainer Schedule Panel */}
          <Col xs={24} lg={12}>
            <Card title="Trainer Schedule" className="h-fit">
              {selectedTrainer && selectedTrainer.schedule && Array.isArray(selectedTrainer.schedule) && selectedTrainer.schedule.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800">Available Days & Times</h4>
                    <span className="text-sm text-gray-500">{getHoursPerWeek()} hours/week</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {selectedTrainer.schedule.map((slot, index) => (
                      <Tag key={index} color="green" className="text-sm">
                        {slot.day} {slot.startTime} - {slot.endTime}
                      </Tag>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This trainer is available for {getHoursPerWeek()} hours per week across {selectedTrainer.schedule.length} day{selectedTrainer.schedule.length > 1 ? 's' : ''}.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No schedule information available</p>
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