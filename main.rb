require 'sinatra'
require 'ims/lti'
require 'rack'
require 'oauth/request_proxy/rack_request'
require 'net/http'
require 'json'
require_relative 'song_db'

# otherwise SAMEORIGIN is set and the frame can't be embedded in Canvas
set :protection, :except => :frame_options

get '/' do
  erb :tracker
end

post '/' do
  return erb :error unless authorize!
  erb :tracker
end

post '/submit' do
  puts params.inspect

  launch_params = params['launch_params']
  if launch_params
    key = launch_params['oauth_consumer_key']
  else
    show_error "The tool never launched"
    return erb :error
  end

  @tp = IMS::LTI::ToolProvider.new(key, $oauth_creds[key], launch_params)
  @tp.extend IMS::LTI::Extensions::OutcomeData::ToolProvider

  if !@tp.outcome_service?
    show_error "This tool wasn't lunched as an outcome service... mmm, lunch."
    return erb :error
  end

  @points_possible = launch_params['custom_canvas_assignment_points_possible'].to_f || 1
  score = [1, (params['activity']['score'].to_f / @points_possible).round(4)].min
  res = @tp.post_replace_result_with_data!(score, "cdata_text" => erb(:submission, layout: false))
  if res.success?
    content_type :json
    { placeholder: "watch this space" }
  else
    show_error res.description
  end
end

get '/songs/:id' do
  content_type :json
  SongDB.new.get_song(params[:id])
end

post '/songs' do
  content_type :json
  unless params[:data] && params[:data].length
    status 400
    return { "error" => "no data provided" }.to_json
  end
  id, token = SongDB.new.create_song(params[:data])
  { "ok" => true, "id" => id, "token" => token }.to_json
end

put '/songs/:id' do
  content_type :json
  unless params[:data] && params[:data].length
    status 400
    return { "error" => "no data provided" }.to_json
  end
  unless params[:token] && params[:token].length
    status 401
    return { "error" => "missing token" }.to_json
  end
  SongDB.new.update_song(params[:id], params[:data], params[:token])
  { "ok" => true }.to_json
end

def show_error(error)
  status 500
  content_type :html
  @message = error
  erb :error
end

def authorize!
  if key = params['oauth_consumer_key']
    if secret = $oauth_creds[key]
      @tp = IMS::LTI::ToolProvider.new(key, secret, params)
    else
      @tp = IMS::LTI::ToolProvider.new(nil, nil, params)
      @tp.lti_msg = "Your consumer didn't use a recognized key."
      @tp.lti_errorlog = "You did it wrong!"
      show_error "Consumer key wasn't recognized"
      return false
    end
  else
    show_error "No consumer key"
    return false
  end

  if !@tp.valid_request?(request)
    show_error "The OAuth signature was invalid"
    return false
  end

  if Time.now.utc.to_i - @tp.request_oauth_timestamp.to_i > 60*60
    show_error "Your request is too old."
    return false
  end

  if was_nonce_used_in_last_x_minutes?(@tp.request_oauth_nonce, 60)
    show_error "Why are you reusing the nonce?"
    return false
  end

  return true
end

def was_nonce_used_in_last_x_minutes?(nonce, minutes=60)
  # nope. not gonna bother for hack week :P
  false
end
