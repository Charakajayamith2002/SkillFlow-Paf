import React, { useState } from "react";
import { Modal, Form, Input, Button, Select, Row, Col, Typography } from "antd";
import { useSnapshot } from "valtio";
import state from "../../Utils/Store";
import SkillShareService from "../../Services/SkillShareService";
import UploadFileService from "../../Services/UploadFileService";
import { UploadOutlined, DeleteOutlined, InboxOutlined } from "@ant-design/icons";

const { Option } = Select;
const { Title } = Typography;
const uploader = new UploadFileService();

// Theme colors from the first component
const themeColors = {
  primary: "#FF6B35", // Bright and inviting orange
  secondary: "#FF8F1C", // Softer tangerine for a modern touch
  accent: "#FF4500", // Fresh red-orange for highlights
  background: "#FFF5E6", // Light orangeish-white for a clean look
  surface: "#FFF0D9", // Soft light orange for surfaces
  cardBg: "#FFFFFF", // White background for cards
  textPrimary: "#1E3A5F", // Deep navy for readability
  textSecondary: "#5A7184", // Muted blue-gray for secondary text
  border: "rgba(0, 0, 0, 0.12)", // Subtle neutral border
  hover: "#FF5733", // Slightly darker orange for hover effects
  danger: "#FF4D4F", // Friendly red for warnings
  success: "#28A745", // Balanced green for success messages
  gradient: "linear-gradient(135deg, #FF6B35 0%, #FF8F1C 100%)", // Light, engaging orange gradient
};
//add validation to create skill share modal
const CreateSkillShareModal = () => {
  const snap = useSnapshot(state);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      // Call the service to create the Skill Share
      await SkillShareService.createSkillShare({
        ...values,
        userId: snap.currentUser?.uid,
        mediaUrls: mediaFiles.map(file => file.url),
        mediaTypes: mediaFiles.map(file => file.type)
      });
      state.SkillShares = await SkillShareService.getAllSkillShares();
      
      // Reset the form and close the modal on success
      form.resetFields();
      setMediaFiles([]);
      state.createSkillShareOpened = false;
    } catch (error) {
      console.error("Error creating Skill Share:", error);
    } finally {
      setLoading(false);
    }
  };

  // Use a custom file input instead of Ant's Upload component to avoid duplication issues
  const handleFileInputChange = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Check if adding these files would exceed the limit
    if (mediaFiles.length + files.length > 3) {
      alert(`You can only upload up to 3 files in total. You've selected ${files.length} files but can only add ${3 - mediaFiles.length} more.`);
      // Reset the file input
      e.target.value = null;
      return;
    }
    
    setUploadingMedia(true);
    
    try {
      // Process all files in parallel
      const uploadPromises = files.map(async (file) => {
        const fileType = file.type.split("/")[0];
        
        // Validate video duration if it's a video
        if (fileType === "video") {
          const isValid = await validateVideoDuration(file);
          if (!isValid) {
            alert(`Video "${file.name}" must be 30 seconds or less`);
            return null;
          }
        }
        
        const url = await uploader.uploadFile(file, "posts");
        
        return {
          uid: Date.now() + Math.random().toString(36).substring(2, 9),
          url: url,
          type: fileType,
          name: file.name
        };
      });
      
      const results = await Promise.all(uploadPromises);
      const validResults = results.filter(result => result !== null);
      
      setMediaFiles(prev => [...prev, ...validResults]);
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setUploadingMedia(false);
      // Reset the file input
      e.target.value = null;
    }
  };

  const validateVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = function() {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration <= 30);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const removeMediaFile = (uid) => {
    setMediaFiles(prev => prev.filter(file => file.uid !== uid));
  };

  const renderMediaPreview = () => {
    return (
      <>
        <p style={{ color: themeColors.textPrimary }}>Media Files ({mediaFiles.length}/3):</p>
        <Row gutter={[16, 16]}>
          {mediaFiles.map(file => (
            <Col key={file.uid} span={8}>
              <div style={{ position: 'relative' }}>
                {file.type === 'image' ? (
                  <img 
                    src={file.url} 
                    alt={file.name}
                    style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }}
                  />
                ) : (
                  <video 
                    src={file.url} 
                    controls
                    style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }}
                  />
                )}
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />} 
                  onClick={() => removeMediaFile(file.uid)}
                  style={{ 
                    position: 'absolute', 
                    top: 0, 
                    right: 0,
                    background: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: 8
                  }}
                />
              </div>
            </Col>
          ))}
        </Row>
      </>
    );
  };

  // Custom drop zone instead of using Ant's Dragger
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (uploadingMedia || mediaFiles.length >= 3) return;
    
    const files = Array.from(e.dataTransfer.files);
    
    // Check if adding these files would exceed the limit
    if (mediaFiles.length + files.length > 3) {
      alert(`You can only upload up to 3 files in total. You've dropped ${files.length} files but can only add ${3 - mediaFiles.length} more.`);
      return;
    }
    
    setUploadingMedia(true);
    
    try {
      // Process all files in parallel
      const uploadPromises = files.map(async (file) => {
        // Check if file is image or video
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          alert(`File "${file.name}" is not an image or video.`);
          return null;
        }
        
        const fileType = file.type.split("/")[0];
        
        // Validate video duration if it's a video
        if (fileType === "video") {
          const isValid = await validateVideoDuration(file);
          if (!isValid) {
            alert(`Video "${file.name}" must be 30 seconds or less`);
            return null;
          }
        }
        
        const url = await uploader.uploadFile(file, "posts");
        
        return {
          uid: Date.now() + Math.random().toString(36).substring(2, 9),
          url: url,
          type: fileType,
          name: file.name
        };
      });
      
      const results = await Promise.all(uploadPromises);
      const validResults = results.filter(result => result !== null);
      
      setMediaFiles(prev => [...prev, ...validResults]);
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setUploadingMedia(false);
    }
  };

  return (
    <Modal
      title={<Title level={4} style={{ color: themeColors.textPrimary }}>Share Your Skills</Title>}
      open={snap.createSkillShareOpened}
      footer={null}
      onCancel={() => {
        state.createSkillShareOpened = false;
      }}
      width={550}
      centered
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="mealDetails"
          label="Descriptions"
          rules={[{ required: true, message: "Please enter Descriptions" }]}
        >
          <Input.TextArea 
            style={{ borderRadius: 8, borderColor: themeColors.border }}
            placeholder="Share details about your skills"
            rows={4}
          />
        </Form.Item>
        
        {mediaFiles.length > 0 && renderMediaPreview()}
        
        {uploadingMedia && <p style={{ color: themeColors.secondary }}>Media is uploading, please wait...</p>}
        
        <Form.Item
          label="Upload Media (up to 3 photos or videos, videos max 30 sec)"
          rules={[{ required: mediaFiles.length === 0, message: "Please upload at least one media file" }]}
        >
          <div 
            style={{ 
              border: `2px dashed ${themeColors.border}`, 
              borderRadius: '8px', 
              padding: '20px', 
              textAlign: 'center',
              background: themeColors.background,
              cursor: mediaFiles.length >= 3 ? 'not-allowed' : 'pointer'
            }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <p><InboxOutlined style={{ fontSize: '48px', color: themeColors.primary }} /></p>
            <p style={{ margin: '8px 0', color: themeColors.textPrimary }}>
              Click or drag files to this area to upload
            </p>
            <p style={{ color: themeColors.textSecondary }}>
              {mediaFiles.length >= 3 ? 
                "Maximum number of files reached" : 
                `Select up to ${3 - mediaFiles.length} files at once. Supports images and videos.`}
            </p>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileInputChange}
              disabled={mediaFiles.length >= 3 || uploadingMedia}
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: mediaFiles.length >= 3 ? 'not-allowed' : 'pointer'
              }}
            />
          </div>
        </Form.Item>
        
        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button 
              onClick={() => {
                state.createSkillShareOpened = false;
                form.resetFields();
                setMediaFiles([]);
              }}
              style={{ 
                borderRadius: 8,
                marginRight: 12
              }}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              disabled={mediaFiles.length === 0 || uploadingMedia}
              style={{
                background: themeColors.primary,
                borderColor: themeColors.primary,
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(255, 107, 53, 0.2)"
              }}
            >
              Share Skill
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateSkillShareModal;