import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Utensils, Gift, UserCheck } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    entered: 0,
    foodTaken: 0,
    goodiesCollected: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'participants'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let total = 0;
      let entered = 0;
      let foodTaken = 0;
      let goodiesCollected = 0;

      querySnapshot.forEach((doc) => {
        total++;
        const data = doc.data();
        if (data.entry) entered++;
        if (data.foodTaken) foodTaken++;
        if (data.goodiesCollected) goodiesCollected++;
      });

      setStats({
        total,
        entered,
        foodTaken,
        goodiesCollected
      });
      setLoading(false);
    }, (error) => {
      console.error("Error fetching realtime data: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-heading text-tedx-red mb-3">Live Dashboard</h2>
      <p className="text-muted mb-4">Real-time statistics synced across all scanning devices.</p>

      <div className="dashboard-grid">
        <div className="stat-card">
          <Users size={32} className="text-tedx-red mb-2" />
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Participants</div>
        </div>
        
        <div className="stat-card">
          <UserCheck size={32} className="text-tedx-red mb-2" />
          <div className="stat-value highlight">{stats.entered}</div>
          <div className="stat-label">Entered</div>
        </div>

        <div className="stat-card">
          <Utensils size={32} className="text-tedx-red mb-2" />
          <div className="stat-value highlight">{stats.foodTaken}</div>
          <div className="stat-label">Food Taken</div>
        </div>

        <div className="stat-card">
          <Gift size={32} className="text-tedx-red mb-2" />
          <div className="stat-value highlight">{stats.goodiesCollected}</div>
          <div className="stat-label">Goodies Collected</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
