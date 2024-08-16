'use client';
import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import './insidepuzzlearena.scss';

const PuzzlePageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileId = searchParams.get('file_id') || '66bb8396af2a1e3287996406'; // Default file_id
  const title = searchParams.get('title') || 'Mastering Pawn Structure';
  const level = searchParams.get('level') || 'Pawn';
  const category = searchParams.get('category') || 'Middlegame';
  const puzzle_number = searchParams.get('puzzle_number') || '1';

  const [timer, setTimer] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  const [solutions, setSolutions] = useState<{ id: string; move: string; sid_link: string; solution: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'move' | 'solution' | 'sid' | null>('move'); // Default to 'move'
  const [congratulationsVisible, setCongratulationsVisible] = useState<boolean>(false); // New state for congratulatory message
  const [showSolutionPopup, setShowSolutionPopup] = useState<boolean>(false); // New state for solution popup visibility
  const [showMissedItPopup, setShowMissedItPopup] = useState<boolean>(false); // New state for "Missed It" popup visibility
  const intervalRef = useRef<number | undefined>(undefined);
  
  const [isButtonsActive, setIsButtonsActive] = useState<boolean>(false);

  const handleGoBack = () => {
    router.back(); // Navigate back to the previous page
  };

  useEffect(() => {
    fetchImageFile(fileId); // Call API with fileId
    fetchSolutions(); // Fetch solutions

    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [fileId]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else if (!isRunning && timer !== 0) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const fetchImageFile = (id: string) => {
    axios.post(
        'https://backend-chess-tau.vercel.app/image_get_fileid',
        { file_id: id },
        { responseType: 'blob' }
      )
      .then(response => {
        const url = URL.createObjectURL(
          new Blob([response.data], { type: response.headers['content-type'] })
        );
        setImageSrc(url);
      })
      .catch(error => {
        console.error(`Error fetching image with file ID ${id}:`, error);
      });
  };

  const fetchSolutions = () => {
    axios.get(`https://backend-chess-tau.vercel.app/images/solutions?title=${title}&level=${level}&category=${category}&id=${fileId}`)
      .then(response => {
        setSolutions(response.data.images);
        console.log(`Fetched solutions:`, response.data.images);
      })
      .catch(error => {
        console.error('Error fetching solutions:', error);
      });
  };

  const handleStartStopTimer = () => {
    setIsRunning(prev => !prev); // Toggle timer state
    setIsButtonsActive(true); // Activate buttons when timer starts
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleShowSolution = () => {
    if (isButtonsActive) {
      setShowSolutionPopup(true); // Show the solution popup
    } else {
      alert("Please click on Start Timer");
    }
  };

  const closeSolutionPopup = () => {
    setShowSolutionPopup(false); // Hide the solution popup
  };

  const handleShowSidLink = () => {
    if (isButtonsActive) {
      if (solutions.length > 0) {
        window.open(solutions[0].sid_link, '_blank');
      }
    } else {
      alert("Please click on Start Timer");
    }
  };

  const handleGotItRight = async () => {
    if (isButtonsActive) {
      const userDetailsString = localStorage.getItem('userDetails');
      const storedUserDetails = userDetailsString ? JSON.parse(userDetailsString) : null; 
      const email = storedUserDetails ? storedUserDetails.email : '';

      try {
        await axios.post('https://backend-chess-tau.vercel.app/update_puzzle_started', {
          email,
          category,
          title,
          puzzle_no: `Puzzle${puzzle_number}`,
          score: 1
        });
        console.log('Puzzle status updated successfully');
        setCongratulationsVisible(true); // Show the congratulations message
      } catch (error) {
        console.error('Error updating puzzle status:', error);
      }
    } else {
      alert("Please click on Start Timer");
    }
  };
 


  const handleMissedIt =async () => {
    if (isButtonsActive) {
      setShowMissedItPopup(true); // Show the "Missed It" popup
      const userDetailsString = localStorage.getItem('userDetails');
      const storedUserDetails = userDetailsString ? JSON.parse(userDetailsString) : null; 
      const email = storedUserDetails ? storedUserDetails.email : '';

      try {
        await axios.post('https://backend-chess-tau.vercel.app/update_puzzle_started', {
          email,
          category,
          title,
          puzzle_no: `Puzzle${puzzle_number}`,
          score: 0,
          option_guessed:false
        });
        console.log('Puzzle status updated successfully');
      } catch (error) {
        console.error('Error updating puzzle status:', error);
      }
    } else {
      alert("Please click on Start Timer");
    }
  };

  const closeMissedItPopup = () => {
    setShowMissedItPopup(false); // Hide the "Missed It" popup
  };

  return (
    <div className="puzzle-container">
      <div className="puzzle-header">
        <table>
          <thead>
            <tr>
              <th>Level</th>
              <th>Category</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{level}</td>
              <td>{category}</td>
              <td>{title}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="puzzle-content">
        <div className="chessboard">
          {imageSrc ? (
            <img src={imageSrc} alt="Chessboard" />
          ) : (
            <p>Loading image...</p>
          )}
           <div className="move-indicator">
             {solutions.length > 0 ? solutions[0].move : 'Loading move...'}
           </div>
        </div>
        <div className="puzzle-info">
        <div className="response-buttons1">
          <h2>Puzzle{puzzle_number}</h2>
          <button className="timer-btn" onClick={handleStartStopTimer}>
            {isRunning ? 'Stop Timer' : 'Start Timer'}
            <div className="timer-display">
              {formatTime(timer)}
            </div>
          </button>
          <button className="solution-btn" onClick={handleShowSolution}>
            Solution
          </button>
          <button className="ask-sid-btn" onClick={handleShowSidLink}>
            Ask Sid
          </button>
        </div>
        <div className="response-buttons">
          <h1>Response</h1>
          <button className="correct-btn" onClick={handleGotItRight}>Got it Right</button>
          <button className="incorrect-btn" onClick={handleMissedIt}>Missed It</button>
        </div>
        <div className="navigation-buttons">
        <button className="nav-btn" onClick={handleGoBack}>Go Back To Arena</button>
        </div>
        </div>
      </div>
      
      {congratulationsVisible && (
        <div className="congratulations-message">
          <p>Hurray, you got it right! Your score is added.</p>
          <button className="congratulations-btn" onClick={() => setCongratulationsVisible(false)}>
            OK
          </button>
        </div>
      )}
      {showSolutionPopup && solutions.length > 0 && (
        <div className="popup-overlay">
          <div className="popup-content">
            <p>{solutions[0].solution}</p>
            <button className="close-popup-btn" onClick={closeSolutionPopup}>
              Close
            </button>
          </div>
        </div>
      )}
      {showMissedItPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <p>Oh no! Keep practicing.</p>
            <button className="close-popup-btn" onClick={closeMissedItPopup}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const InsidePuzzleArena = () => (
  <Suspense fallback={<div>Loading puzzle data...</div>}>
    <PuzzlePageContent />
  </Suspense>
);

export default InsidePuzzleArena;