  const firebaseConfig = {
    apiKey: "AIzaSyCHCD7rOMIo848m4IE3hKdvJxOtLEpLNOA",
    authDomain: "do-submundo-aos-ceus.firebaseapp.com",
    databaseURL: "https://do-submundo-aos-ceus-default-rtdb.firebaseio.com",
    projectId: "do-submundo-aos-ceus",
    storageBucket: "do-submundo-aos-ceus.firebasestorage.app",
    messagingSenderId: "792746263716",
    appId: "1:792746263716:web:21c8ca497a838d874ed231",
    measurementId: "G-LNS0KVYKDE"
  };

  const app = firebase.initializeApp(firebaseConfig);

  const database = firebase.database();

  const rolagensRef = database.ref('rolagens');
  rolagensRef.on('child_added', (snapshot) => {
    const novaRolagem = snapshot.val();
    logRolagens.push(novaRolagem);
    if(logRolagens.length > 20) {
      logRolagens.shift();
    }
    atualizarLog();
  });
