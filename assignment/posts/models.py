from django.db import models
from app.models import User
import uuid
class Post(models.Model):

    id = models.UUIDField(
    primary_key=True,
    default=uuid.uuid4,
    editable=False
    ) 
       
    VISIBILITY_CHOICES = [
        ("public", "Public"),
        ("followers", "Followers Only"),
    ]
    image = models.ImageField(upload_to="posts/", blank=True, null=True)

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="posts",
    )
    likes = models.ManyToManyField(
        User,
        related_name="liked_posts",
        blank=True
    )

    dislikes = models.ManyToManyField(
        User,
        related_name="disliked_posts",
        blank=True
    )
    title = models.CharField(max_length=100,blank=True)

    caption = models.TextField()

    visibility = models.CharField(
        max_length=20,
        choices=VISIBILITY_CHOICES,
        default="public",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class PostImage(models.Model):

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="images",
    )

    image = models.ImageField(upload_to="posts/")


class Hashtag(models.Model):

    name = models.CharField(max_length=50, unique=True)

    posts = models.ManyToManyField(
        Post,
        related_name="hashtags",
        blank=True,
    )

    def __str__(self):
        return self.name



#followersclass Follow(models.Model):
class Follow(models.Model):

    follower = models.ForeignKey(
    User,
    on_delete=models.CASCADE,
    related_name="following",
    )

    following = models.ForeignKey(
    User,on_delete=models.CASCADE, related_name="followers" )
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ("follower", "following")
    def __str__(self):
        return f"{self.follower} follows {self.following}"





class Comment(models.Model):
    id= models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="comments"
    )

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="comments"
    )

    content = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.name} - {self.post.title}"

