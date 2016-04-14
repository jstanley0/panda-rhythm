require 'pg'
require 'uri'
require 'securerandom'

class SongDB
  attr_accessor :connection, :params

  def get_song(id)
    connect do
      res = @connection.exec_params('SELECT data FROM songs WHERE ID=$1', [id])
      raise Sinatra::NotFound unless res.ntuples == 1
      res[0]['data']
    end
  end

  def create_song(data)
    connect do
      id = SecureRandom::hex(8)
      res = @connection.exec('INSERT INTO songs (id, data) VALUES ($1, $2)', [id, data])
      raise "failed to insert somehow" unless res.cmdtuples == 1
      id
    end
  end

  def update_song(id, data)
    connect do
      res = @connection.exec('UPDATE songs SET data=$2 WHERE id=$1', [id, data])
      res.cmdtuples == 1
      raise Sinatra::NotFound unless res.cmdtuples == 1
    end
  end

  private

  # I should learn how connection management/pooling might work in heroku etc.
  # But for now just connect for each operation.  This dumb thing doesn't talk to the DB much anyhow,
  # since it uses localStorage for most things :P
  def connect
    begin
      @connection = PG.connect(connection_params)
      yield
    ensure
      @connection.close if @connection
    end
  end

  def connection_params
    @params ||= begin
      database_url = ENV['DATABASE_URL']
      raise 'DATABASE_URL not set' unless database_url
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
