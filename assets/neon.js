import { createClient } from 'https://esm.sh/@neondatabase/neon-js?bundle';

const cfg=window.HAULMATCH_CONFIG||{};
const state={client:null,session:null,user:null,ready:false};
const emit=(name,detail={})=>window.dispatchEvent(new CustomEvent(name,{detail}));

function friendly(error,fallback='Neon request failed'){
  const message=String(error?.message||error?.details||error||fallback);
  return message.replace(/^Error:\s*/,'');
}

async function init(){
  try{
    if(!cfg.neonDatabaseUrl)throw new Error('Neon database URL is not configured.');
    state.client=createClient(cfg.neonDatabaseUrl,{auth:{allowAnonymous:true}});
    const result=await state.client.auth.getSession();
    state.session=result?.data?.session||null;
    state.user=result?.data?.user||state.session?.user||null;
    state.ready=true;
    emit('hm:neon-ready',{signedIn:!!state.user,user:state.user});
    emit('hm:auth-changed',{signedIn:!!state.user,user:state.user});
  }catch(error){
    console.error('Neon initialization failed',error);
    emit('hm:neon-error',{error:friendly(error)});
  }
}

async function publicLeads(){
  if(!state.client)throw new Error('Neon is not ready.');
  const {data,error}=await state.client.rpc('public_get_leads');
  if(error)throw error;
  return (data||[]).map(x=>({
    reference:x.reference,
    transportType:x.transport_type,
    description:x.description,
    quantity:x.quantity,
    mass:x.mass_kg?`${x.mass_kg} kg`:'',
    dimensions:x.dimensions||'',
    collection:x.collection_area,
    delivery:x.delivery_area,
    requiredDate:x.required_date||'',
    specialHandling:x.special_handling||'',
    publicNote:x.public_note||'',
    leadCost:Number(x.lead_cost||0),
    responseCount:Number(x.response_count||0),
    responseLimit:Number(x.response_limit||0),
    photoLink:x.photo_url||''
  }));
}

async function signIn(email,password){
  if(!state.client)throw new Error('Neon is not ready.');
  const {data,error}=await state.client.auth.signIn.email({email:String(email).trim().toLowerCase(),password});
  if(error)throw error;
  state.session=data?.session||null;
  state.user=data?.user||state.session?.user||null;
  emit('hm:auth-changed',{signedIn:true,user:state.user});
  return state.user;
}


async function signUp(name,email,password){
  if(!state.client)throw new Error('Neon is not ready.');
  const {data,error}=await state.client.auth.signUp.email({name:String(name||'').trim(),email:String(email).trim().toLowerCase(),password});
  if(error)throw error;
  state.session=data?.session||null;
  state.user=data?.user||state.session?.user||null;
  emit('hm:auth-changed',{signedIn:!!state.user,user:state.user});
  return {user:state.user,session:state.session};
}

async function signInGoogle(){
  if(!state.client)throw new Error('Neon is not ready.');
  const callbackURL=window.location.origin+'/transport-leads/';
  const {data,error}=await state.client.auth.signIn.social({provider:'google',callbackURL});
  if(error)throw error;
  return data;
}

async function signOut(){
  if(state.client)await state.client.auth.signOut();
  state.session=null;state.user=null;
  emit('hm:auth-changed',{signedIn:false,user:null});
}

async function ownProfile(){
  if(!state.user)throw new Error('Sign in as an approved transporter first.');
  const {data,error}=await state.client.from('transporters').select('id,reference,contact_name,company,email,status,moderation_status').limit(1);
  if(error)throw error;
  if(!data?.length)throw new Error('This login is not linked to an approved transporter profile.');
  return data[0];
}

async function wallet(){
  const profile=await ownProfile();
  const {data,error}=await state.client.from('wallets').select('balance,opening_balance,updated_at').eq('transporter_id',profile.id).limit(1);
  if(error)throw error;
  if(!data?.length)throw new Error('Wallet not found for this transporter.');
  return {profile,wallet:data[0]};
}

async function unlock(reference){
  if(!state.user)throw new Error('Sign in as an approved transporter first.');
  const {data,error}=await state.client.rpc('secure_unlock_lead',{p_request_reference:String(reference||'').trim().toUpperCase()});
  if(error)throw error;
  if(!data?.length)throw new Error('The lead could not be unlocked.');
  return data[0];
}

window.HMNEON={
  state,
  publicLeads,
  signIn,
  signUp,
  signInGoogle,
  signOut,
  ownProfile,
  wallet,
  unlock,
  friendly
};
init();
