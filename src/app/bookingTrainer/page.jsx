"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DatePicker, Form, Button, Card, Row, Col, TimePicker, Select, Checkbox, App, Tag, Spin, Alert } from "antd";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import TopSection from "../components/topSection";
import BookingPaymentModal from "../components/BookingPaymentModal";
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
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [selectedServices, setSelectedServices] = useState({
    disciplines: {
      dressage: false,
      showJumping: false,
      eventing: false,
      endurance: false,
      western: false,
      vaulting: false
    },
    training: {
      onLocationLessons: false,
      lessonsOnTrainersLocation: false
    },
    competitionCoaching: {
      onLocationCoaching: false
    }
  });
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

  // Handle service selection
  const handleServiceChange = (serviceType, serviceName, checked) => {
    setSelectedServices(prev => ({
      ...prev,
      [serviceType]: {
        ...prev[serviceType],
        [serviceName]: checked
      }
    }));
  };

  // Calculate number of days in booking
  const getNumberOfDays = () => {
    if (!selectedDateRange || selectedDateRange.length !== 2) return 0;
    return selectedDateRange[1].diff(selectedDateRange[0], 'day') + 1;
  };

  // Calculate additional service costs
  const getAdditionalServiceCosts = () => {
    if (!selectedTrainer || !selectedDateRange) return 0;
    
    const numberOfDays = getNumberOfDays();
    let totalAdditionalCost = 0;

    // Disciplines costs (per day)
    if (selectedServices.disciplines.dressage && selectedTrainer.disciplines?.dressage) {
      totalAdditionalCost += (selectedTrainer.disciplines.dressagePrice || 0) * numberOfDays;
    }
    if (selectedServices.disciplines.showJumping && selectedTrainer.disciplines?.showJumping) {
      totalAdditionalCost += (selectedTrainer.disciplines.showJumpingPrice || 0) * numberOfDays;
    }
    if (selectedServices.disciplines.eventing && selectedTrainer.disciplines?.eventing) {
      totalAdditionalCost += (selectedTrainer.disciplines.eventingPrice || 0) * numberOfDays;
    }
    if (selectedServices.disciplines.endurance && selectedTrainer.disciplines?.endurance) {
      totalAdditionalCost += (selectedTrainer.disciplines.endurancePrice || 0) * numberOfDays;
    }
    if (selectedServices.disciplines.western && selectedTrainer.disciplines?.western) {
      totalAdditionalCost += (selectedTrainer.disciplines.westernPrice || 0) * numberOfDays;
    }
    if (selectedServices.disciplines.vaulting && selectedTrainer.disciplines?.vaulting) {
      totalAdditionalCost += (selectedTrainer.disciplines.vaultingPrice || 0) * numberOfDays;
    }

    // Training costs (per day)
    if (selectedServices.training.onLocationLessons && selectedTrainer.training?.onLocationLessons) {
      totalAdditionalCost += (selectedTrainer.training.onLocationLessonsPrice || 0) * numberOfDays;
    }
    if (selectedServices.training.lessonsOnTrainersLocation && selectedTrainer.training?.lessonsOnTrainersLocation) {
      totalAdditionalCost += (selectedTrainer.training.lessonsOnTrainersLocationPrice || 0) * numberOfDays;
    }

    // Competition coaching costs (per day)
    if (selectedServices.competitionCoaching.onLocationCoaching && selectedTrainer.competitionCoaching?.onLocationCoaching) {
      totalAdditionalCost += (selectedTrainer.competitionCoaching.onLocationCoachingPrice || 0) * numberOfDays;
    }

    return totalAdditionalCost;
  };

  // Get service price details for detailed breakdown
  const getServicePriceDetails = () => {
    if (!selectedTrainer || !selectedDateRange) return {};
    
    const numberOfDays = getNumberOfDays();
    const priceDetails = {
      disciplines: {
        dressage: selectedServices.disciplines.dressage,
        dressagePrice: selectedServices.disciplines.dressage && selectedTrainer.disciplines?.dressage ? (selectedTrainer.disciplines.dressagePrice || 0) * numberOfDays : 0,
        showJumping: selectedServices.disciplines.showJumping,
        showJumpingPrice: selectedServices.disciplines.showJumping && selectedTrainer.disciplines?.showJumping ? (selectedTrainer.disciplines.showJumpingPrice || 0) * numberOfDays : 0,
        eventing: selectedServices.disciplines.eventing,
        eventingPrice: selectedServices.disciplines.eventing && selectedTrainer.disciplines?.eventing ? (selectedTrainer.disciplines.eventingPrice || 0) * numberOfDays : 0,
        endurance: selectedServices.disciplines.endurance,
        endurancePrice: selectedServices.disciplines.endurance && selectedTrainer.disciplines?.endurance ? (selectedTrainer.disciplines.endurancePrice || 0) * numberOfDays : 0,
        western: selectedServices.disciplines.western,
        westernPrice: selectedServices.disciplines.western && selectedTrainer.disciplines?.western ? (selectedTrainer.disciplines.westernPrice || 0) * numberOfDays : 0,
        vaulting: selectedServices.disciplines.vaulting,
        vaultingPrice: selectedServices.disciplines.vaulting && selectedTrainer.disciplines?.vaulting ? (selectedTrainer.disciplines.vaultingPrice || 0) * numberOfDays : 0
      },
      training: {
        onLocationLessons: selectedServices.training.onLocationLessons,
        onLocationLessonsPrice: selectedServices.training.onLocationLessons && selectedTrainer.training?.onLocationLessons ? (selectedTrainer.training.onLocationLessonsPrice || 0) * numberOfDays : 0,
        lessonsOnTrainersLocation: selectedServices.training.lessonsOnTrainersLocation,
        lessonsOnTrainersLocationPrice: selectedServices.training.lessonsOnTrainersLocation && selectedTrainer.training?.lessonsOnTrainersLocation ? (selectedTrainer.training.lessonsOnTrainersLocationPrice || 0) * numberOfDays : 0
      },
      competitionCoaching: {
        onLocationCoaching: selectedServices.competitionCoaching.onLocationCoaching,
        onLocationCoachingPrice: selectedServices.competitionCoaching.onLocationCoaching && selectedTrainer.competitionCoaching?.onLocationCoaching ? (selectedTrainer.competitionCoaching.onLocationCoachingPrice || 0) * numberOfDays : 0
      }
    };

    return priceDetails;
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
    
    let basePrice = 0;
    if (bookingType === 'week') {
      // Calculate number of weeks and multiply by actual hours per week
      const weeks = Math.ceil(endDate.diff(startDate, 'day') / 7);
      basePrice = hourlyRate * hoursPerWeek * weeks;
    } else if (bookingType === 'month') {
      // Calculate number of months and multiply by hours per month (hours per week * 4)
      const months = Math.ceil(endDate.diff(startDate, 'month', true));
      const hoursPerMonth = hoursPerWeek * 4; // Assuming 4 weeks per month
      basePrice = hourlyRate * hoursPerMonth * months;
    } else {
      basePrice = hourlyRate;
    }
    
    // Add additional service costs
    const additionalCosts = getAdditionalServiceCosts();
    return basePrice + additionalCosts;
  };

  // Get base booking price (without additional services)
  const getBaseBookingPrice = () => {
    if (!selectedTrainer || !bookingType || !selectedDateRange) return 0;
    
    const hourlyRate = selectedTrainer.price || 0;
    const hoursPerWeek = getHoursPerWeek();
    const startDate = dayjs(selectedDateRange[0]);
    const endDate = dayjs(selectedDateRange[1]);
    
    if (bookingType === 'week') {
      const weeks = Math.ceil(endDate.diff(startDate, 'day') / 7);
      return hourlyRate * hoursPerWeek * weeks;
    } else if (bookingType === 'month') {
      const months = Math.ceil(endDate.diff(startDate, 'month', true));
      const hoursPerMonth = hoursPerWeek * 4;
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

  // Handle form submission - show payment modal
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

    try {
      const servicePriceDetails = getServicePriceDetails();
      
      const bookingPayload = {
        userId: selectedTrainer?.userId?._id || selectedTrainer?.userId,
        clientId: userData.id,
        trainerId: selectedTrainer?._id,
        trainerTitle: selectedTrainer?.title,
        bookingDate: dayjs().format('YYYY-MM-DD'),
        bookingType: bookingType,
        startDate: selectedDateRange[0].format('YYYY-MM-DD'),
        endDate: selectedDateRange[1].format('YYYY-MM-DD'),
        basePrice: getBaseBookingPrice(),
        additionalServices: selectedServices,
        servicePriceDetails: servicePriceDetails,
        additionalServiceCosts: getAdditionalServiceCosts(),
        totalPrice: calculateTotalPrice(),
        numberOfDays: getNumberOfDays(),
        price: getPricePerUnit() // Legacy field for backward compatibility
      };
      
      console.log('Preparing booking data for payment:', bookingPayload);
      
      // Set booking data and show payment modal
      setBookingData(bookingPayload);
      setPaymentModalVisible(true);
      
    } catch (error) {
      console.error('Error preparing booking:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to prepare booking data',
        placement: 'topRight',
      });
    }
  };

  // Handle successful booking after payment
  const handleBookingSuccess = (bookingResponse, paymentIntent) => {
    notification.success({
      message: 'Booking Successful',
      description: 'Your training session has been confirmed and payment processed!',
      placement: 'topRight',
    });
    
    // Reset form
    form.resetFields();
    setBookingType(null);
    setSelectedDateRange(null);
    setSelectedServices({
      disciplines: {
        dressage: false,
        showJumping: false,
        eventing: false,
        endurance: false,
        western: false,
        vaulting: false
      },
      training: {
        onLocationLessons: false,
        lessonsOnTrainersLocation: false
      },
      competitionCoaching: {
        onLocationCoaching: false
      }
    });
  };

  return (
    <div className="font-sans">
      <TopSection title="Booking Trainer" />
      
      <section className="mx-auto max-w-6xl px-4 py-10">
        {/* Top Section: Selected Trainer and Trainer Schedule - 50% each */}
        <Row gutter={[24, 24]} className="mb-6">
          {/* Selected Trainer Information - 50% width */}
          <Col xs={24} lg={12}>
      {selectedTrainer && (
              <Card title="Selected Trainer" className="h-full">
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
                          <strong>Experience:</strong> {selectedTrainer.Experience}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-brand/10 text-brand border border-brand/20">
                    ${selectedTrainer.price}/hour
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-brand/10 text-brand border border-brand/20">
                          ${(selectedTrainer.price * getHoursPerWeek()).toFixed(2)}/week ({getHoursPerWeek().toFixed(2)} hours)
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-brand/10 text-brand border border-brand/20">
                          ${(selectedTrainer.price * getHoursPerWeek() * 4).toFixed(2)}/month ({(getHoursPerWeek() * 4).toFixed(2)} hours)
                  </span>
                </div>
                {selectedTrainer.userId && (
                  <p className="text-sm text-gray-500">
                    Trainer: {selectedTrainer.userId.firstName} {selectedTrainer.userId.lastName}
                    {selectedTrainer.userId.email && ` (${selectedTrainer.userId.email})`}
                  </p>
                )}
                      {selectedTrainer.diplomas && selectedTrainer.diplomas.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Diplomas:</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedTrainer.diplomas.map((diploma, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                                {diploma}
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

          {/* Trainer Schedule Panel - 50% width */}
          <Col xs={24} lg={12}>
            <Card title="Trainer Schedule" className="h-full">
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
                    <Option value="week">Week</Option>
                    <Option value="month">Month</Option>
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
                {selectedTrainer && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Additional Services</h4>
                    
                    <Row gutter={[16, 16]}>
                      {/* Disciplines */}
                      {(selectedTrainer.disciplines && Object.values(selectedTrainer.disciplines).some(option => option)) && (
                        <Col xs={24} lg={12}>
                          <div className="border rounded-lg p-4 bg-blue-50 h-full">
                            <h5 className="font-semibold text-blue-800 mb-3">Disciplines (Per Day)</h5>
                            <div className="space-y-2">
                              {selectedTrainer.disciplines.dressage && (
                                <div className="flex items-center justify-between">
                                  <Checkbox
                                    checked={selectedServices.disciplines.dressage}
                                    onChange={(e) => handleServiceChange('disciplines', 'dressage', e.target.checked)}
                                  >
                                    <span className="text-sm">Dressage</span>
                                  </Checkbox>
                                  <span className="text-sm font-medium text-blue-700">
                                    ${selectedTrainer.disciplines.dressagePrice}/day
                                  </span>
                                </div>
                              )}
                              {selectedTrainer.disciplines.showJumping && (
                                <div className="flex items-center justify-between">
                                  <Checkbox
                                    checked={selectedServices.disciplines.showJumping}
                                    onChange={(e) => handleServiceChange('disciplines', 'showJumping', e.target.checked)}
                                  >
                                    <span className="text-sm">Show Jumping</span>
                                  </Checkbox>
                                  <span className="text-sm font-medium text-blue-700">
                                    ${selectedTrainer.disciplines.showJumpingPrice}/day
                                  </span>
                                </div>
                              )}
                              {selectedTrainer.disciplines.eventing && (
                                <div className="flex items-center justify-between">
                                  <Checkbox
                                    checked={selectedServices.disciplines.eventing}
                                    onChange={(e) => handleServiceChange('disciplines', 'eventing', e.target.checked)}
                                  >
                                    <span className="text-sm">Eventing</span>
                                  </Checkbox>
                                  <span className="text-sm font-medium text-blue-700">
                                    ${selectedTrainer.disciplines.eventingPrice}/day
                                  </span>
                                </div>
                              )}
                              {selectedTrainer.disciplines.endurance && (
                                <div className="flex items-center justify-between">
                                  <Checkbox
                                    checked={selectedServices.disciplines.endurance}
                                    onChange={(e) => handleServiceChange('disciplines', 'endurance', e.target.checked)}
                                  >
                                    <span className="text-sm">Endurance</span>
                                  </Checkbox>
                                  <span className="text-sm font-medium text-blue-700">
                                    ${selectedTrainer.disciplines.endurancePrice}/day
                                  </span>
                                </div>
                              )}
                              {selectedTrainer.disciplines.western && (
                                <div className="flex items-center justify-between">
                                  <Checkbox
                                    checked={selectedServices.disciplines.western}
                                    onChange={(e) => handleServiceChange('disciplines', 'western', e.target.checked)}
                                  >
                                    <span className="text-sm">Western</span>
                                  </Checkbox>
                                  <span className="text-sm font-medium text-blue-700">
                                    ${selectedTrainer.disciplines.westernPrice}/day
                                  </span>
                                </div>
                              )}
                              {selectedTrainer.disciplines.vaulting && (
                                <div className="flex items-center justify-between">
                                  <Checkbox
                                    checked={selectedServices.disciplines.vaulting}
                                    onChange={(e) => handleServiceChange('disciplines', 'vaulting', e.target.checked)}
                                  >
                                    <span className="text-sm">Vaulting</span>
                                  </Checkbox>
                                  <span className="text-sm font-medium text-blue-700">
                                    ${selectedTrainer.disciplines.vaultingPrice}/day
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Col>
                      )}

                      {/* Training */}
                      {(selectedTrainer.training && Object.values(selectedTrainer.training).some(option => option)) && (
                        <Col xs={24} lg={12}>
                          <div className="border rounded-lg p-4 bg-green-50 h-full">
                            <h5 className="font-semibold text-green-800 mb-3">Training (Per Day)</h5>
                            <div className="space-y-2">
                              {selectedTrainer.training.onLocationLessons && (
                                <div className="flex items-center justify-between">
                                  <Checkbox
                                    checked={selectedServices.training.onLocationLessons}
                                    onChange={(e) => handleServiceChange('training', 'onLocationLessons', e.target.checked)}
                                  >
                                    <span className="text-sm">On Location Lessons</span>
                                  </Checkbox>
                                  <span className="text-sm font-medium text-green-700">
                                    ${selectedTrainer.training.onLocationLessonsPrice}/day
                                  </span>
                                </div>
                              )}
                              {selectedTrainer.training.lessonsOnTrainersLocation && (
                                <div className="flex items-center justify-between">
                                  <Checkbox
                                    checked={selectedServices.training.lessonsOnTrainersLocation}
                                    onChange={(e) => handleServiceChange('training', 'lessonsOnTrainersLocation', e.target.checked)}
                                  >
                                    <span className="text-sm">Lessons on Trainer's Location</span>
                                  </Checkbox>
                                  <span className="text-sm font-medium text-green-700">
                                    ${selectedTrainer.training.lessonsOnTrainersLocationPrice}/day
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Col>
                      )}

                      {/* Competition Coaching */}
                      {(selectedTrainer.competitionCoaching && Object.values(selectedTrainer.competitionCoaching).some(option => option)) && (
                        <Col xs={24} lg={12}>
                          <div className="border rounded-lg p-4 bg-purple-50 h-full">
                            <h5 className="font-semibold text-purple-800 mb-3">Competition Coaching (Per Day)</h5>
                            <div className="space-y-2">
                              {selectedTrainer.competitionCoaching.onLocationCoaching && (
                                <div className="flex items-center justify-between">
                                  <Checkbox
                                    checked={selectedServices.competitionCoaching.onLocationCoaching}
                                    onChange={(e) => handleServiceChange('competitionCoaching', 'onLocationCoaching', e.target.checked)}
                                  >
                                    <span className="text-sm">On Location Coaching</span>
                                  </Checkbox>
                                  <span className="text-sm font-medium text-purple-700">
                                    ${selectedTrainer.competitionCoaching.onLocationCoachingPrice}/day
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
                        <span className="font-bold text-brand">${getPricePerUnit().toFixed(2)}</span>
                      </div>
                      
                      {/* Additional Services Breakdown */}
                      {getAdditionalServiceCosts() > 0 && (
                        <div className="pt-2 border-t border-gray-200">
                          <div className="text-sm text-gray-600 mb-2">Additional Services:</div>
                          {selectedServices.disciplines.dressage && selectedTrainer.disciplines?.dressage && (
                            <div className="flex justify-between text-sm">
                              <span>Dressage × {getNumberOfDays()} days:</span>
                              <span>${((selectedTrainer.disciplines.dressagePrice || 0) * getNumberOfDays()).toFixed(2)}</span>
                            </div>
                          )}
                          {selectedServices.disciplines.showJumping && selectedTrainer.disciplines?.showJumping && (
                            <div className="flex justify-between text-sm">
                              <span>Show Jumping × {getNumberOfDays()} days:</span>
                              <span>${((selectedTrainer.disciplines.showJumpingPrice || 0) * getNumberOfDays()).toFixed(2)}</span>
                            </div>
                          )}
                          {selectedServices.disciplines.eventing && selectedTrainer.disciplines?.eventing && (
                            <div className="flex justify-between text-sm">
                              <span>Eventing × {getNumberOfDays()} days:</span>
                              <span>${((selectedTrainer.disciplines.eventingPrice || 0) * getNumberOfDays()).toFixed(2)}</span>
                            </div>
                          )}
                          {selectedServices.disciplines.endurance && selectedTrainer.disciplines?.endurance && (
                            <div className="flex justify-between text-sm">
                              <span>Endurance × {getNumberOfDays()} days:</span>
                              <span>${((selectedTrainer.disciplines.endurancePrice || 0) * getNumberOfDays()).toFixed(2)}</span>
                            </div>
                          )}
                          {selectedServices.disciplines.western && selectedTrainer.disciplines?.western && (
                            <div className="flex justify-between text-sm">
                              <span>Western × {getNumberOfDays()} days:</span>
                              <span>${((selectedTrainer.disciplines.westernPrice || 0) * getNumberOfDays()).toFixed(2)}</span>
                            </div>
                          )}
                          {selectedServices.disciplines.vaulting && selectedTrainer.disciplines?.vaulting && (
                            <div className="flex justify-between text-sm">
                              <span>Vaulting × {getNumberOfDays()} days:</span>
                              <span>${((selectedTrainer.disciplines.vaultingPrice || 0) * getNumberOfDays()).toFixed(2)}</span>
                            </div>
                          )}
                          {selectedServices.training.onLocationLessons && selectedTrainer.training?.onLocationLessons && (
                            <div className="flex justify-between text-sm">
                              <span>On Location Lessons × {getNumberOfDays()} days:</span>
                              <span>${((selectedTrainer.training.onLocationLessonsPrice || 0) * getNumberOfDays()).toFixed(2)}</span>
                            </div>
                          )}
                          {selectedServices.training.lessonsOnTrainersLocation && selectedTrainer.training?.lessonsOnTrainersLocation && (
                            <div className="flex justify-between text-sm">
                              <span>Lessons on Trainer's Location × {getNumberOfDays()} days:</span>
                              <span>${((selectedTrainer.training.lessonsOnTrainersLocationPrice || 0) * getNumberOfDays()).toFixed(2)}</span>
                            </div>
                          )}
                          {selectedServices.competitionCoaching.onLocationCoaching && selectedTrainer.competitionCoaching?.onLocationCoaching && (
                            <div className="flex justify-between text-sm">
                              <span>On Location Coaching × {getNumberOfDays()} days:</span>
                              <span>${((selectedTrainer.competitionCoaching.onLocationCoachingPrice || 0) * getNumberOfDays()).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-medium pt-1 border-t border-gray-200">
                            <span>Additional Services Total:</span>
                            <span>${getAdditionalServiceCosts().toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800">Total Price:</span>
                          <span className="text-xl font-bold text-brand">${calculateTotalPrice().toFixed(2)}</span>
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
                    className="w-full mt-4"
                    disabled={!bookingType || !selectedDateRange}
                  >
                    Proceed to Payment (€{calculateTotalPrice().toFixed(2)})
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
        </section>
        
        {/* Payment Modal */}
        <BookingPaymentModal
          visible={paymentModalVisible}
          onCancel={() => setPaymentModalVisible(false)}
          bookingData={bookingData}
          onBookingSuccess={handleBookingSuccess}
        />
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