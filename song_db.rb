require 'pg'
require 'uri'
require 'zlib'
require 'securerandom'

class SongDB
  class Error < ::StandardError
    attr_accessor :status, :message

    def initialize(status, message)
      self.status = status
      self.message = message
    end
  end

  def get_song(id)
    connect do |conn|
      conn.exec_params('SELECT data FROM songs WHERE ID=$1', [id], 1) do |result|
        raise Error.new(404, 'song not found') unless result.ntuples == 1
        Zlib::inflate(result[0]['data'])
      end
    end
  end

  def create_song(data)
    connect do |conn|
      id = SecureRandom::hex(8)
      token = SecureRandom::hex(8)
      conn.exec('INSERT INTO songs (id, data, token) VALUES ($1, $2, $3)', [id, compressed_blob(data), token]) do |result|
        raise Error.new(500, "failed to insert somehow") unless result.cmdtuples == 1
        [id, token]
      end
    end
  end

  def update_song(id, data, token)
    connect do |conn|
      conn.exec('UPDATE songs SET data=$2 WHERE id=$1 AND token=$3', [id, compressed_blob(data), token]) do |result|
        raise Error.new(401, 'incorrect token') unless result.cmdtuples == 1
        true
      end
    end
  end

  private

  def compressed_blob(data)
    { :value => Zlib::deflate(data), :type => 0, :format => 1 }
  end

  def connect
    @connection ||= PG.connect(connection_params)
    @connection.reset if @connection.status == PG::CONNECTION_BAD
    yield @connection
  end

  def connection_params
    @params ||= begin
      database_url = ENV['DATABASE_URL']
      raise Error.new(500, 'DATABASE_URL not set') unless database_url
      uri = URI.parse(database_url)
      {
          host: uri.host,
          port: uri.port,
          dbname: uri.path[1..-1],
          user: uri.user,
          password: uri.password
      }
    end
  end
end
