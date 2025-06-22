import React, { useState } from 'react';
import { Input, Button, message, Card, Row, Col } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './Login.css';

const Login = () => {
  const { setAuth } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [postLoginLoading, setPostLoginLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      message.error('Please enter both username and password');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });
      const { token, role } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      setAuth({ token, role });
      message.success('Logged in successfully');

      setPostLoginLoading(true);
      setTimeout(() => {
        setPostLoginLoading(false);
        navigate('/dashboard');
      }, 2500); // Increased to 2.5s to match slower animation
    } catch (err) {
      message.error('Login failed: ' + err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Carousel settings
  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    fade: true,
  };

  // Array of images with captions
  const slides = [
    {
      url: 'https://images.pexels.com/photos/1831271/pexels-photo-1831271.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      caption: 'Soaring Over Paradise',
    },
    {
      url: 'https://images.pexels.com/photos/373893/pexels-photo-373893.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      caption: 'Majestic Mountain Escape',
    },
    {
      url: 'https://images.pexels.com/photos/31694663/pexels-photo-31694663/free-photo-of-aerial-view-of-rocky-beach-and-clear-waters.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      caption: 'Rocky Shores Await',
    },
    {
      url: 'https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      caption: 'City Lights from Above',
    },
  ];

  return (
    <div
      className="login-container"
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '20px',
      }}
    >
      {postLoginLoading && (
        <div
          className="loading-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 3,
          }}
        >
          <div
            style={{
              position: 'absolute',
              animation: 'flyAcross 2.5s ease-in-out forwards', // Slower animation
            }}
          >
            <img
              src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZG12dmNwbXVmbmg1djdmZTZ0a3ZsYnhtc2dmMzVsaG42NDFzbDZheSZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/zL8DbfAYR9rK7z4ahY/giphy.gif"
              alt="Flying Plane"
              style={{
                width: '150px', // Larger size
                height: '150px',
                // transform: 'rotate(-10deg)', // Slight tilt for realism
              }}
            />
          </div>
        </div>
      )}
      {/* Carousel */}
      <Slider
        {...carouselSettings}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
        }}
      >
        {slides.map((slide, index) => (
          <div key={index} style={{ width: '100%', height: '100vh', position: 'relative' }}>
            <img
              src={slide.url}
              alt={`Travel Background ${index + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
            />
            {/* Caption with hover effect */}
            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                textAlign: 'center',
                zIndex: 1,
                maxWidth: '80%',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                opacity: 0,
                transition: 'opacity 0.3s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
            >
              {slide.caption}
            </div>
          </div>
        ))}
      </Slider>
      {/* Overlay for readability */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1,
        }}
      />
      <Card
        title={
          <div style={{ textAlign: 'center' }}>
            <UserOutlined style={{ fontSize: '40px', color: '#fff' }} />
            <h1 style={{ margin: '10px 0 0', color: '#fff', fontWeight: '700', fontSize: '30px', textShadow: '0 2px 6px rgba(0, 0, 0, 0.6)' }}>
              Travel Expense Tracker
            </h1>
          </div>
        }
        style={{
          width: '100%',
          maxWidth: '450px',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.85)',
          zIndex: 2,
          padding: '20px',
          backdropFilter: 'blur(5px)',
        }}
      >
        <Row gutter={[0, 20]}>
          <Col span={24}>
            <Input
              prefix={<UserOutlined />}
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              size="large"
              style={{ borderRadius: '6px', background: '#fff', padding: '8px' }}
            />
          </Col>
          <Col span={24}>
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              size="large"
              style={{ borderRadius: '6px', background: '#fff', padding: '8px' }}
            />
          </Col>
          <Col span={24} style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              onClick={handleLogin}
              loading={loading}
              style={{ width: '100%', background: '#1890ff', borderColor: '#1890ff', borderRadius: '6px', padding: '8px 16px', fontWeight: 'bold' }}
            >
              Login
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Login;