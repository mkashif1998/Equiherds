"use client";

import { useState } from "react";
import { DatePicker, Form, Button, Card, Row, Col, TimePicker, Select, message } from "antd";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import TopSection from "../components/topSection";

// Extend dayjs with required plugins
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function BookingStablesPage() {
  const [form] = Form.useForm();
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Mock available time slots as ranges
  const timeSlots = [
    { start: "08:00", end: "12:00", label: "08:00 to 12:00" },
    { start: "10:00", end: "14:00", label: "10:00 to 14:00" },
  ];

  // Mock stable options
  const stableOptions = [
    { value: "stable1", label: "Stable 1 - Premium" },
    { value: "stable2", label: "Stable 2 - Standard" },
    { value: "stable3", label: "Stable 3 - Economy" },
    { value: "stable4", label: "Stable 4 - Deluxe" }
  ];

  // Handle date range selection
  const handleDateRangeChange = (dates) => {
    console.log('Date range changed:', dates);
    setSelectedDateRange(dates);
    
    if (dates && dates[0] && dates[1]) {
      // Check if dates are valid
      const startDate = dates[0];
      const endDate = dates[1];
      
      if (startDate && endDate && startDate.isValid() && endDate.isValid()) {
        setSlotsLoading(true);
        // Generate available slots for the selected date range
        generateAvailableSlots(startDate, endDate);
      } else {
        console.warn('Invalid dates provided');
        setAvailableSlots([]);
        setSlotsLoading(false);
      }
    } else {
      setAvailableSlots([]);
      setSlotsLoading(false);
    }
  };

  // Generate available slots based on date range
  const generateAvailableSlots = (startDate, endDate) => {
    try {
      const slots = [];
      const current = startDate.clone();
      const end = endDate.clone();
      let dayCount = 0;
      const maxDays = 30; // Safety limit to prevent infinite loops
      
      while (current.isSameOrBefore(end, 'day') && dayCount < maxDays) {
        const daySlots = timeSlots.map(slot => ({
          date: current.format('YYYY-MM-DD'),
          time: slot.label,
          startTime: slot.start,
          endTime: slot.end,
          available: Math.random() > 0.3, // Mock availability (70% chance)
          price: Math.floor(Math.random() * 50) + 25 // Mock price between $25-$75
        }));
        
        slots.push({
          date: current.format('YYYY-MM-DD'),
          dayName: current.format('dddd'),
          slots: daySlots
        });
        
        current.add(1, 'day');
        dayCount++;
      }
      
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error generating slots:', error);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      message.success('Booking request submitted successfully!');
      form.resetFields();
      setSelectedDateRange(null);
      setAvailableSlots([]);
    } catch (error) {
      message.error('Failed to submit booking request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans">
      <TopSection title="Booking Stables" />
      
      <section className="mx-auto max-w-6xl px-4 py-10">
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

                <Form.Item
                  label="Select Stable"
                  name="stable"
                  rules={[{ required: true, message: 'Please select a stable' }]}
                >
                  <Select
                    size="large"
                    placeholder="Choose a stable"
                    options={stableOptions}
                  />
                </Form.Item>

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

                <Form.Item
                  label="Special Requirements"
                  name="requirements"
                >
                  <Select
                    size="large"
                    mode="multiple"
                    placeholder="Select any special requirements"
                    options={[
                      { value: "feeding", label: "Feeding Service" },
                      { value: "grooming", label: "Grooming Service" },
                      { value: "exercise", label: "Exercise Program" },
                      { value: "medical", label: "Medical Care" },
                      { value: "transport", label: "Transportation" }
                    ]}
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={loading}
                    className="w-full"
                  >
                    Submit Booking Request
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          {/* Available Slots */}
          <Col xs={24} lg={12}>
            <Card title="Available Time Slots" className="h-fit">
              {slotsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading available slots...</p>
                </div>
              ) : selectedDateRange ? (
                <div className="space-y-4">
                  {availableSlots.map((day, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-semibold text-lg mb-3 text-brand">
                        {day.dayName} - {day.date}
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {day.slots.map((slot, slotIndex) => (
                          <button
                            key={slotIndex}
                            className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                              slot.available
                                ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300'
                                : 'bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-300'
                            }`}
                            disabled={!slot.available}
                          >
                            <div className="font-semibold">{slot.time}</div>
                            {slot.available && (
                              <div className="text-xs mt-1 text-green-600">${slot.price}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Please select a date range to view available slots</p>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </section>
    </div>
  );
}


