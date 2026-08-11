from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Follow, User,Comment, Post, PostImage, Hashtag


class ProfileSerializer(serializers.ModelSerializer):
    followers = serializers.SerializerMethodField()
    following = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "name",
            "email",
            "phone",
            "bio",
            "profile_picture",
            "followers",
            "following",
            "posts_count",
        ]
        read_only_fields = [
            "email",
            "followers",
            "following",
            "posts_count",
        ]
    @extend_schema_field(serializers.IntegerField())
    def get_followers(self, obj):
        return obj.followers.count()


    @extend_schema_field(serializers.IntegerField())
    def get_following(self, obj):
        return obj.following.count()

    @extend_schema_field(serializers.IntegerField())
    def get_posts_count(self, obj):
        return obj.posts.count()


    
from rest_framework import serializers
from .models import Post, PostImage, Hashtag


class PostImageSerializer(serializers.ModelSerializer):

    class Meta:
        model = PostImage
        fields = ["id", "image"]


class HashtagSerializer(serializers.ModelSerializer):

    class Meta:
        model = Hashtag
        fields = ["id", "name"]


class PostSerializer(serializers.ModelSerializer):

    images = PostImageSerializer(many=True, read_only=True)
    hashtags = HashtagSerializer(many=True, read_only=True)
    user = serializers.IntegerField(source="user_id", read_only=True)
    author_name = serializers.CharField(source="user.name", read_only=True)

    class Meta:
        model = Post
        fields = [
            "id",
            "user",
            "author_name",
            "title",
            "caption",
            "visibility",
            "images",
            "hashtags",
            "created_at",
        ]


class likeserializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['id', 'likes', 'dislikes']

class commentserializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['id', 'content']

class CommentResponseSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="post.id", read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'content']
class UserList(serializers.ModelSerializer):
    class Meta:
        model =  User
        fields = ['name','id']

class followers(serializers.ModelSerializer):
    class Meta:
        model = Follow
        fields = ['follower',]