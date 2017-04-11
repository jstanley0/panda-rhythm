require 'sinatra'
require 'ims/lti'
require 'rack'
require 'oauth/request_proxy/rack_request'
require 'net/http'
require 'json'
require_relative 'song_db'

# the not-very-secrets
$oauth_creds = {"0bd73cbad2d5d4e690de7c8eb72d3c50" => "f48fe8d1121ba068638fd27796cff27a"}

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

# a test song with tracks A to Z resulted in a 12760-byte payload
MAX_DATA_LENGTH = 16384

$songdb = SongDB.new

def handle_songdb_error
  begin
    yield
  rescue SongDB::Error => e
    status e.status
    { "error" => e.message }.to_json
  end
end

get '/songs/:id' do
  content_type :json
  handle_songdb_error do
    $songdb.get_song(params[:id])
  end
end

post '/songs' do
  content_type :json
  unless params[:data] && params[:data].length
    status 400
    return { "error" => "no data provided" }.to_json
  end
  if params[:data].length > MAX_DATA_LENGTH
    status 400
    return { "error" => "data too long" }.to_json
  end
  unless (JSON.parse(params[:data]) rescue false)
    status 400
    return { "error" => "invalid song" }.to_json
  end
  handle_songdb_error do
    id, token = $songdb.create_song(params[:data])
    { "ok" => true, "id" => id, "token" => token }.to_json
  end
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
  handle_songdb_error do
    $songdb.update_song(params[:id], params[:data], params[:token])
    { "ok" => true }.to_json
  end
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
      @authenticator = IMS::LTI::Services::MessageAuthenticator.new(request.url, params, secret)
    else
      show_error "Consumer key wasn't recognized"
      return false
    end
  else
    show_error "No consumer key"
    return false
  end

  @authenticator.valid_signature?
end

