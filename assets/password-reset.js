(() => {
  const $=id=>document.getElementById(id);
  let ready=false;
  function setMessage(text,kind='info'){
    const box=$('resetMessage'); if(!box)return;
    box.textContent=text; box.className='reset-message '+kind;
  }
  function enable(){ready=true;document.querySelectorAll('[data-auth-action]').forEach(x=>x.disabled=false)}
  window.addEventListener('hm:neon-ready',enable);
  window.addEventListener('hm:neon-error',e=>setMessage(e.detail?.error||'Authentication service unavailable.','error'));
  document.addEventListener('DOMContentLoaded',()=>{
    if(window.HMNEON?.state?.ready)enable();
    const forgot=$('forgotForm');
    if(forgot)forgot.addEventListener('submit',async event=>{
      event.preventDefault();
      if(!ready){setMessage('Authentication is still loading. Try again in a moment.','error');return}
      const button=$('sendResetButton');button.disabled=true;setMessage('Sending secure reset email...');
      try{
        await HMNEON.requestPasswordReset($('resetEmail').value);
        forgot.reset();
        setMessage('If the email is registered, a reset link has been sent. Check Inbox and Spam. The link expires after 15 minutes.','success');
      }catch(error){setMessage(HMNEON.friendly(error),'error')}
      finally{button.disabled=false}
    });
    const reset=$('newPasswordForm');
    if(reset){
      const token=new URLSearchParams(location.search).get('token');
      if(!token||token==='INVALID_TOKEN'){
        setMessage('This reset link is invalid or has expired. Request a new link.','error');
        $('savePasswordButton').disabled=true;
      }
      reset.addEventListener('submit',async event=>{
        event.preventDefault();
        const password=$('newPassword').value,confirm=$('confirmPassword').value;
        if(password.length<8){setMessage('Use at least 8 characters.','error');return}
        if(password!==confirm){setMessage('The two passwords do not match.','error');return}
        const button=$('savePasswordButton');button.disabled=true;setMessage('Saving the new password...');
        try{
          await HMNEON.resetPassword(password,token);
          reset.reset();setMessage('Password updated successfully. You can now return to Buy Credits and sign in.','success');
          $('returnToShop').classList.remove('hidden');
        }catch(error){setMessage(HMNEON.friendly(error),'error');button.disabled=false}
      });
    }
  });
})();
