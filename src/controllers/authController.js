function view(req, res){
  res.render('login', { error: null });
}

function login(req, res){
  const { email, password } = req.body || {};
  const ok = email === 'admin@yonetici.com' && password === 'admin123';
  if(!ok){
    return res.status(401).render('login', { error: 'Geçersiz e-posta veya şifre' });
  }
  res.cookie('admin_auth', 'yes', { httpOnly: true, sameSite: 'lax' });
  res.redirect('/');
}

function logout(req, res){
  res.clearCookie('admin_auth');
  res.redirect('/login');
}

module.exports = { view, login, logout };

