import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { switchMap } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { visibility, expand } from '../animations/app.animation';

import { Dish } from '../shared/dish';
import { DishService } from '../services/dish.service';
import { Comment } from '../shared/comment';

@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  animations: [
    visibility(),
    expand()
  ]
})
export class DishdetailComponent implements OnInit {

  @ViewChild('cform') commentFormDirective;

  dish : Dish;
  comment: Comment;
  commentForm: FormGroup;
  dishIds: string[];
  prev: string;
  next: string;
  errMess: string;
  dishcopy: Dish;
  visibility = 'shown';

  constructor(private dishService: DishService,
    private route: ActivatedRoute,
    private location: Location,
    private fb: FormBuilder,
    @Inject("baseURL") private baseURL) {
      this.createForm();
    }

    ngOnInit() {
      this.dishService.getDishIds().subscribe(dishIds => this.dishIds = dishIds);
      this.route.params.pipe(switchMap((params: Params) => { this.visibility = 'hidden'; return this.dishService.getDish(+params['id']); }))
      .subscribe(dish => { this.dish = dish; this.dishcopy = dish; this.setPrevNext(dish.id); this.visibility = 'shown'; },
        errmess => this.errMess = <any>errmess);
    }

    createForm() {
      this.commentForm = this.fb.group({
        author: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(25)] ],
        comment: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)] ],
        rating: [''],
        date: ['']
      });
      this.commentForm.valueChanges
        .subscribe(data => this.onValueChanged(data));

      this.onValueChanged();
    }

    formErrors = {
       'author': '',
       'comment': '',
       'rating': '',
       'date': ''
     };

     validationMessages = {
       'author': {
         'required':      'Author is required.',
         'minlength':     'Author must be at least 2 characters long.',
         'maxlength':     'Author cannot be more than 25 characters long.'
       },
       'comment': {
         'required':      'Comment is required.',
         'minlength':     'Comment must be at least 2 characters long.',
         'maxlength':     'Commentcannot be more than 100 characters long.'
       },
       'rating': {
         'required':      'Tel. number is required.'
       },
       'date': {
         'required':      'Email is required.',
         'pattern':        'Please enter valid format.'
       },
     };

    onValueChanged(data?: any) {
      if (!this.commentForm) { return; }
      const form = this.commentForm;
      for (const field in this.formErrors) {
        if (this.formErrors.hasOwnProperty(field)) {
          // clear previous error message (if any)
          this.formErrors[field] = '';
          const control = form.get(field);
          if (control && control.dirty && !control.valid) {
            const messages = this.validationMessages[field];
            for (const key in control.errors) {
              if (control.errors.hasOwnProperty(key)) {
                this.formErrors[field] += messages[key] + ' ';
              }
            }
          }
        }
      }
    }

    onSubmit() {
      this.comment = this.commentForm.value;
      this.comment.date=new Date().toISOString();
      this.dishcopy.comments.push(this.comment);
      this.dishService.putDish(this.dishcopy)
     .subscribe(dish => {
       this.dish = dish; this.dishcopy = dish;
     },
     errmess => { this.dish = null; this.dishcopy = null; this.errMess = <any>errmess; });
      console.log(this.comment);
      this.commentForm.reset({
        author: '',
        comment: '',
        rating: '',
        date: ''
      });
      this.commentFormDirective.resetForm();
    }


  setPrevNext(dishId: string) {
    const index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
  }

  goBack(): void {
    this.location.back();
  }

}
