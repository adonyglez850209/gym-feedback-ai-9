"use client";

/**
 * HomePage Component
 * 
 * This component serves as the main page of the application, orchestrating the pose detection functionality
 * and managing the overall user interface. It integrates various components such as VideoPlayer, PoseCanvas,
 * and Controls to create a cohesive user experience for pose detection.
 * 
 * Key Features:
 * - Token Management: Implements functions for obtaining and refreshing authentication tokens.
 * - Model Fetching: Retrieves the pose detection model from the backend server.
 * - Pose Landmarker Initialization: Sets up the PoseLandmarker using MediaPipe's vision tasks.
 * - Video Source Selection: Allows users to choose between uploading a video or using their webcam.
 * - Dynamic Rendering: Conditionally renders components based on the user's selection and application state.
 * 
 * State Management:
 * - poseLandmarker: Stores the initialized PoseLandmarker instance.
 * - videoSrc: Holds the source URL for uploaded videos.
 * - useWebcam: Boolean flag to indicate if the webcam is being used.
 * - sourceSelected: Indicates whether a video source has been chosen.
 * - videoDimensions: Stores the current dimensions of the video display.
 * - feedback: Stores any feedback or messages to be displayed.
 * 
 * Effects:
 * - Initializes the PoseLandmarker when a video source is selected.
 * - Cleans up resources when the component unmounts.
 * 
 * The component's layout is structured using Material-UI components, providing a responsive and
 * visually appealing interface for the pose detection application.
 */

import React, { useEffect, useRef, useState } from 'react';
import VideoPlayer from './VideoPlayer';
import PoseCanvas from './PoseCanvas';
import Controls from './Controls';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { Box, Typography, AppBar, Toolbar } from '@mui/material';

async function getToken() {
  const tokenResponse = await fetch('/api/py/token', {
    method: 'POST',
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to fetch the token');
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function refreshToken() {
  const token = await getToken();

  const response = await fetch('/api/py/refresh-token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  return data.access_token;
}

/*
async function fetchModel() {
  const token = await getToken();
  let response;

  try {
    response = await fetch('/api/py/model', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      // If token expired, try refreshing it
      console.log("Token expired, refreshing...");
      const newToken = await refreshToken();

      response = await fetch('/api/py/model', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${newToken}`,
        },
      });
    }

    if (!response.ok) {
      throw new Error('Failed to fetch the model file');
    }

    const modelBlob = await response.blob();
    return URL.createObjectURL(modelBlob);
  } catch (error) {
    console.error("Error fetching model:", error);
    throw error; // Re-throw the error for further handling
  }
}
*/

async function fetchModel() {
  // En lugar de obtener un token, simplemente accede al modelo directamente
  const modelUrl = '/models/pose_landmarker_heavy.task';

  try {
    const response = await fetch(modelUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch the model file');
    }

    const modelBlob = await response.blob();
    return URL.createObjectURL(modelBlob);
  } catch (error) {
    console.error("Error fetching model:", error);
    throw error; // Re-throw the error for further handling
  }
}

// Main Component Function:
function HomePage() {
  const [poseLandmarker, setPoseLandmarker] = useState(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [useWebcam, setUseWebcam] = useState(false);
  const [sourceSelected, setSourceSelected] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 480, height: 360 });
  const [feedback, setFeedback] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    let landmarker;
    async function loadPoseLandmarker() {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
      );

      const modelURL = await fetchModel();

      landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: modelURL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });
      setPoseLandmarker(landmarker);
    }

    if (sourceSelected) {
      loadPoseLandmarker();
    }

    return () => {
      if (landmarker) {
        landmarker.close();
      }
    };
  }, [sourceSelected]);

  const handleSourceSelect = (source) => {
    if (source === 'webcam') {
      setUseWebcam(true);
      setVideoSrc(null);
    } else {
      setUseWebcam(false);
      setVideoSrc(null); // Reset video source
    }
    setSourceSelected(true);
  };

  const handleVideoUpload = (fileURL) => {
    setVideoSrc(fileURL); // Set the video source to the uploaded file
    setUseWebcam(false); // Ensure webcam is disabled when a video is uploaded
    setSourceSelected(true); // Indicate that a video source has been selected
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Demo App</Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ flexGrow: 1, display: 'flex' }}>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {!sourceSelected ? (
            <Controls setVideoSrc={handleVideoUpload} setUseWebcam={setUseWebcam} onSourceSelect={handleSourceSelect} />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'center' }}>
              <Box sx={{ position: 'relative', marginRight: '20px' }}>
                <VideoPlayer
                  videoSrc={videoSrc}
                  useWebcam={useWebcam}
                  videoRef={videoRef}
                  setVideoDimensions={setVideoDimensions}
                  videoDimensions={videoDimensions}
                  feedback={feedback}  // Pass feedback to VideoPlayer
                />
              </Box>
              <Box sx={{ position: 'relative' }}>
                <PoseCanvas
                  videoRef={videoRef}
                  poseLandmarker={poseLandmarker}
                  videoDimensions={videoDimensions}
                  setFeedback={setFeedback}  // Pass setFeedback to PoseCanvas
                />
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default HomePage;
