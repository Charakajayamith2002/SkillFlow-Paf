import React, { useState } from "react";
import {
  Modal,
  Upload,
  Input,
  Button,
  DatePicker,
  message,
  Select,
  Form,
  Slider,
  Typography,
  Card,
  Divider,
  Row,
  Col
} from "antd";
import { 
  UploadOutlined, 
  ClockCircleOutlined, 
  FireOutlined,
  CalendarOutlined,
  EditOutlined,
  TagOutlined
} from "@ant-design/icons";
import { useSnapshot } from "valtio";
import state from "../../Utils/Store";
import UploadFileService from "../../Services/UploadFileService";
import StoryService from "../../Services/StoryService";
import moment from "moment";

const themeColors = {
  primary: "#9B59B6", // Rich purple for main branding
  secondary: "#BA68C8", // Lighter lavender for contrast and softness
  accent: "#8E44AD", // Deep purple for highlights and calls to action
  background: "#F3E5F5", // Very light lavender for a clean, soft backdrop
  surface: "#E1BEE7", // Gentle purple surface color
  cardBg: "#FFFFFF", // White for card clarity
  textPrimary: "#2E1A47", // Dark violet for strong readability
  textSecondary: "#6A5C7A", // Muted purple-gray for secondary text
  border: "rgba(0, 0, 0, 0.12)", // Neutral border remains unchanged
  hover: "#7E57C2", // Slightly darker purple for hover effects
  danger: "#D32F2F", // Keeping red for clear warnings
  success: "#388E3C", // Keeping green for clarity on success
  gradient: "linear-gradient(135deg, #9B59B6 0%, #BA68C8 100%)", // Smooth purple gradient
};

const uploader = new UploadFileService();
const { Option } = Select;
const { Text, Title } = Typography;

const CreateStoryModal = () => {
  const snap = useSnapshot(state);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    timestamp: null,
    exerciseType: "",
    timeDuration: 30,
    intensity: "",
    image: ""
  });

  // Duration markers for slider
  const durationMarks = {
    0: '0',
    15: '15',
    30: '30',
    45: '45',
    60: '60',
    90: '90',
    120: '120'
  };

  // Function to get intensity color based on duration
  const getIntensityColor = (duration) => {
    if (duration < 15) return '#52c41a';     // Light green - Easy
    if (duration < 30) return '#1890ff';     // Blue - Moderate
    if (duration < 60) return '#faad14';     // Orange - Intense
    return '#f5222d';                        // Red - Very Intense
  };

  const handleCreateWorkoutStory = async () => {
    try {
      setLoading(true);
      const body = {
        ...formData,
        image: uploadedImage,
        userId: snap.currentUser?.uid,
      };
      
      await StoryService.createWorkoutStory(body);
      state.storyCards = await StoryService.getAllWorkoutStories();
      message.success("Learning Plan created successfully");
      
      // Reset form and modal
      form.resetFields();
      setUploadedImage(null);
      state.createWorkoutStatusModalOpened = false;
    } catch (error) {
      message.error("Error creating Learning Plan");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (info) => {
    if (info.file) {
      setImageUploading(true);
      try {
        const url = await uploader.uploadFile(
          info.fileList[0].originFileObj,
          "workoutStories"
        );
        setUploadedImage(url);
      } catch (error) {
        console.error("Error uploading image:", error);
      } finally {
        setImageUploading(false);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      timestamp: date,
    });
  };

  const handleIntensityChange = (value) => {
    setFormData({
      ...formData,
      intensity: value,
    });
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: 4,
            height: 24,
            background: themeColors.primary,
            marginRight: 12,
            borderRadius: 2
          }} />
          <Title level={4} style={{ margin: 0, color: themeColors.textPrimary }}>
            Create Learning Plan
          </Title>
        </div>
      }
      open={snap.createWorkoutStatusModalOpened}
      onCancel={() => {
        state.createWorkoutStatusModalOpened = false;
      }}
      width={650}
      bodyStyle={{ 
        padding: '20px', 
        backgroundColor: themeColors.background,
        borderRadius: '10px'
      }}
      footer={null}
      centered
    >
      <Card 
        bordered={false} 
        style={{ 
          background: themeColors.cardBg,
          borderRadius: '10px',
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)',
          maxHeight: '70vh',  // Limit height
          overflow: 'auto'    // Enable scrolling
        }}
      >
        <Form 
          form={form} 
          layout="vertical"
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px' 
          }}
        >
          <Row gutter={24}>
            <Col span={24}>
              {uploadedImage ? (
                <div style={{ 
                  borderRadius: '10px', 
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  marginBottom: '16px',
                  position: 'relative'
                }}>
                  <img
                    style={{ 
                      width: "100%", 
                      height: "220px",
                      objectFit: 'cover'
                    }}
                    src={uploadedImage}
                    alt="Learning Plan"
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '30px 16px 16px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
                  }}>
                    <Upload
                      accept="image/*"
                      onChange={handleFileChange}
                      showUploadList={false}
                      beforeUpload={() => false}
                    >
                      <Button 
                        icon={<UploadOutlined />} 
                        type="primary"
                        ghost
                        style={{ 
                          borderColor: 'white', 
                          color: 'white',
                          borderRadius: '6px'
                        }}
                      >
                        Change Image
                      </Button>
                    </Upload>
                  </div>
                </div>
              ) : (
                <div style={{
                  marginBottom: '16px',
                  border: `1px dashed ${themeColors.border}`,
                  borderRadius: '10px',
                  padding: '40px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fafafa'
                }}>
                  {imageUploading ? (
                    <Text>Uploading image...</Text>
                  ) : (
                    <Upload
                      accept="image/*"
                      onChange={handleFileChange}
                      showUploadList={false}
                      beforeUpload={() => false}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <UploadOutlined style={{ fontSize: '24px', color: themeColors.primary, marginBottom: '8px' }} />
                        <div>
                          <Text strong>Upload Plan Image</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>Recommend 16:9 ratio</Text>
                        </div>
                      </div>
                    </Upload>
                  )}
                </div>
              )}
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={16}>
              <Form.Item label={
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <EditOutlined style={{ marginRight: '8px', color: themeColors.primary }} />
                  Title
                </span>
              } name="title" rules={[{ required: true, message: 'Please input a title' }]}>
                <Input
                  placeholder="Enter plan title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  style={{ borderRadius: '6px' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarOutlined style={{ marginRight: '8px', color: themeColors.primary }} />
                  Date
                </span>
              } name="timestamp">
                <DatePicker
                  placeholder="Select date"
                  style={{ width: "100%", borderRadius: '6px' }}
                  value={formData.timestamp}
                  onChange={handleDateChange}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <TagOutlined style={{ marginRight: '8px', color: themeColors.primary }} />
              Exercise Type
            </span>
          } name="exerciseType">
            <Input
              placeholder="What type of exercise?"
              name="exerciseType"
              value={formData.exerciseType}
              onChange={handleInputChange}
              style={{ borderRadius: '6px' }}
            />
          </Form.Item>
          
          <Divider style={{ margin: '8px 0', background: themeColors.border }} />
          
          <Form.Item 
            label={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <ClockCircleOutlined style={{ marginRight: '8px', color: themeColors.primary }} />
                  Training Duration
                </span>
                <Text 
                  strong 
                  style={{ 
                    color: getIntensityColor(formData.timeDuration),
                  }}
                >
                  {formData.timeDuration} minutes
                </Text>
              </div>
            }
            name="timeDuration"
            style={{ marginBottom: 0 }}
          >
            <div style={{ 
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '8px',
              border: `1px solid ${themeColors.border}`,
              background: '#fafafa'
            }}>
              <Slider
                min={0}
                max={120}
                step={15}
                value={formData.timeDuration}
                marks={durationMarks}
                tooltip={{ formatter: value => `${value} min` }}
                onChange={(value) => {
                  setFormData({
                    ...formData,
                    timeDuration: value,
                  });
                }}
              />
            </div>
          </Form.Item>

          <Form.Item label={
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <FireOutlined style={{ marginRight: '8px', color: themeColors.primary }} />
              Intensity Level
            </span>
          } name="intensity">
            <Select
              placeholder="Select intensity level"
              style={{ width: "100%", borderRadius: '6px' }}
              value={formData.intensity}
              onChange={handleIntensityChange}
              suffixIcon={<FireOutlined />}
              dropdownStyle={{ borderRadius: '6px' }}
            >
              <Option value="No Efforts">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <FireOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                  No Efforts
                </div>
              </Option>
              <Option value="Mid Efforts">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <FireOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                  Mid Efforts
                </div>
              </Option>
              <Option value="Moderate Efforts">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <FireOutlined style={{ color: '#faad14', marginRight: '8px' }} />
                  Moderate Efforts
                </div>
              </Option>
              <Option value="Severe Efforts">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <FireOutlined style={{ color: '#f5222d', marginRight: '8px' }} />
                  Severe Efforts
                </div>
              </Option>
              <Option value="Maximal Efforts">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <FireOutlined style={{ color: '#722ed1', marginRight: '8px' }} />
                  Maximal Efforts
                </div>
              </Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="Description" name="description">
            <Input.TextArea
              placeholder="Add some details about this learning plan..."
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              style={{ borderRadius: '6px' }}
            />
          </Form.Item>
          
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginTop: '16px'
            }}
          >
            <Button 
              key="cancel" 
              onClick={() => (state.createWorkoutStatusModalOpened = false)}
              style={{
                borderRadius: '6px',
              }}
            >
              Cancel
            </Button>
            <Button
              loading={loading}
              key="create"
              type="primary"
              onClick={handleCreateWorkoutStory}
              style={{
                background: themeColors.gradient,
                borderColor: themeColors.primary,
                borderRadius: '6px',
                boxShadow: "0 2px 8px rgba(255, 107, 53, 0.3)"
              }}
            >
              Create Learning Plan
            </Button>
          </div>
        </Form>
      </Card>
    </Modal>
  );
};

export default CreateStoryModal;